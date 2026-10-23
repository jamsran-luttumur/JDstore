# 作业3：用信息熵（信息增益）进行划分选择，为西瓜数据集生成决策树
# 离散属性多路划分；连续属性“含糖量”采用二分法（候选划分点为相邻取值的中点）
from collections import Counter
from math import log2
import json

attrs = ["色泽", "根蒂", "敲声", "纹理", "触感", "含糖量"]
continuous = {"含糖量"}
data = [
    # 色泽, 根蒂, 敲声, 纹理, 触感, 含糖量, 好瓜
    ["青绿", "蜷缩", "浊响", "清晰", "硬滑", 0.460, "是"],
    ["乌黑", "蜷缩", "沉闷", "清晰", "硬滑", 0.376, "是"],
    ["乌黑", "蜷缩", "浊响", "清晰", "硬滑", 0.264, "是"],
    ["青绿", "蜷缩", "沉闷", "清晰", "硬滑", 0.318, "是"],
    ["浅白", "蜷缩", "浊响", "清晰", "硬滑", 0.215, "是"],
    ["青绿", "稍蜷", "浊响", "清晰", "软粘", 0.237, "是"],
    ["乌黑", "稍蜷", "浊响", "稍糊", "软粘", 0.149, "是"],
    ["乌黑", "稍蜷", "浊响", "清晰", "硬滑", 0.211, "是"],
    ["乌黑", "稍蜷", "沉闷", "稍糊", "硬滑", 0.091, "否"],
    ["青绿", "硬挺", "清脆", "清晰", "软粘", 0.267, "否"],
    ["浅白", "硬挺", "清脆", "模糊", "硬滑", 0.057, "否"],
    ["浅白", "蜷缩", "浊响", "模糊", "软粘", 0.099, "否"],
    ["青绿", "稍蜷", "浊响", "稍糊", "硬滑", 0.161, "否"],
    ["浅白", "稍蜷", "沉闷", "稍糊", "硬滑", 0.198, "否"],
    ["乌黑", "稍蜷", "浊响", "清晰", "软粘", 0.370, "否"],
    ["浅白", "蜷缩", "浊响", "模糊", "硬滑", 0.042, "否"],
    ["青绿", "蜷缩", "沉闷", "稍糊", "硬滑", 0.103, "否"],
]
values = {a: list(dict.fromkeys(r[i] for r in data)) for i, a in enumerate(attrs) if a not in continuous}


def entropy(rows):
    n = len(rows)
    if n == 0:
        return 0.0
    return abs(-sum(c / n * log2(c / n) for c in Counter(r[-1] for r in rows).values()))


def majority(rows):
    cnt = Counter(r[-1] for r in rows)
    return "是" if cnt["是"] >= cnt["否"] else "否"


def gain(rows, a):
    """返回 (信息增益, 划分点)；离散属性划分点为 None"""
    i = attrs.index(a)
    base, n = entropy(rows), len(rows)
    if a in continuous:
        vs = sorted({r[i] for r in rows})
        best = (-1.0, None)
        for t in [(vs[k] + vs[k + 1]) / 2 for k in range(len(vs) - 1)]:
            left = [r for r in rows if r[i] <= t]
            right = [r for r in rows if r[i] > t]
            g = base - len(left) / n * entropy(left) - len(right) / n * entropy(right)
            if g > best[0] + 1e-12:
                best = (g, t)
        return best
    g = base
    for v in values[a]:
        sub = [r for r in rows if r[i] == v]
        g -= len(sub) / n * entropy(sub)
    return g, None


def build(rows, avail, depth=0, cond="根节点"):
    ind = "    " * depth
    labels = Counter(r[-1] for r in rows)
    print(f"{ind}▶ {cond}：样本{len(rows)}个（是{labels['是']}，否{labels['否']}），"
          f"Ent = {entropy(rows):.4f}")
    if len(labels) == 1:
        print(f"{ind}  全部属于同一类 → 叶节点：{rows[0][-1]}")
        return rows[0][-1]
    usable = [a for a in avail if a in continuous or len({r[attrs.index(a)] for r in rows}) > 1]
    if not usable:
        print(f"{ind}  属性已用完 → 叶节点：{majority(rows)}")
        return majority(rows)
    scores = {a: gain(rows, a) for a in usable}
    for a in usable:
        g, t = scores[a]
        extra = f"（划分点 {t:.4f}）" if t is not None else ""
        print(f"{ind}  Gain({a}) = {g:.4f}{extra}")
    best = max(usable, key=lambda a: scores[a][0])
    g, t = scores[best]
    i = attrs.index(best)
    if best in continuous:
        print(f"{ind}  ⇒ 选择 {best} ≤ {t:.4f} 进行划分")
        node = {"属性": f"{best}≤{t:.4f}?", "分支": {}}
        for name, sub in (("是", [r for r in rows if r[i] <= t]), ("否", [r for r in rows if r[i] > t])):
            node["分支"][name] = build(sub, avail, depth + 1, f"{best}≤{t:.4f} = {name}")
        return node
    print(f"{ind}  ⇒ 选择 {best} 进行划分")
    node = {"属性": best, "分支": {}}
    rest = [a for a in avail if a != best]
    for v in values[best]:
        sub = [r for r in rows if r[i] == v]
        if not sub:
            print(f"{ind}    ▶ {best}={v}：无样本 → 叶节点（父节点多数类）：{majority(rows)}")
            node["分支"][v] = majority(rows)
        else:
            node["分支"][v] = build(sub, rest, depth + 1, f"{best}={v}")
    return node


def show(node, prefix=""):
    """以文本树形式输出最终决策树"""
    items = list(node["分支"].items())
    for k, (v, child) in enumerate(items):
        last = k == len(items) - 1
        branch = "└── " if last else "├── "
        if isinstance(child, dict):
            print(f"{prefix}{branch}{v} → [{child['属性']}]")
            show(child, prefix + ("    " if last else "│   "))
        else:
            print(f"{prefix}{branch}{v} → {'好瓜' if child == '是' else '坏瓜'}")


def predict(node, row):
    while isinstance(node, dict):
        a = node["属性"]
        if a.endswith("?"):
            name, t = a[:-1].split("≤")
            node = node["分支"]["是" if row[attrs.index(name)] <= float(t) else "否"]
        else:
            node = node["分支"][row[attrs.index(a)]]
    return node


print("========== 决策树生成过程 ==========")
tree = build(data, attrs)
print("\n========== 最终决策树 ==========")
print(f"[{tree['属性']}]")
show(tree)
acc = sum(predict(tree, r) == r[-1] for r in data) / len(data)
print(f"\n训练集精度：{acc:.2%}")
json.dump(tree, open("hw3_tree.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
