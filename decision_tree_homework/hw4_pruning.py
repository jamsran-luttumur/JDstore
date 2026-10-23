# 作业4：用基尼指数进行划分，生成预剪枝、后剪枝决策树，
#        并与未剪枝决策树（基于信息增益、训练集生成）进行比较
# 离散属性多路划分；连续属性“密度”采用二分法；
# 剪枝判断依据为验证集精度：只有精度严格提高时才划分（预剪枝）/剪枝（后剪枝）
from collections import Counter
from math import log2
import copy
import json

attrs = ["色泽", "根蒂", "敲声", "脐部", "密度"]
continuous = {"密度"}
train = [
    # 编号, 色泽, 根蒂, 敲声, 脐部, 密度, 好瓜
    [1, "青绿", "蜷缩", "浊响", "凹陷", 0.697, "是"],
    [2, "乌黑", "蜷缩", "沉闷", "凹陷", 0.774, "是"],
    [3, "乌黑", "蜷缩", "浊响", "凹陷", 0.634, "是"],
    [6, "青绿", "稍蜷", "浊响", "稍凹", 0.403, "是"],
    [7, "乌黑", "稍蜷", "浊响", "稍凹", 0.481, "是"],
    [10, "青绿", "硬挺", "清脆", "平坦", 0.234, "否"],
    [14, "浅白", "稍蜷", "沉闷", "凹陷", 0.657, "否"],
    [15, "乌黑", "稍蜷", "浊响", "稍凹", 0.360, "否"],
    [16, "浅白", "蜷缩", "浊响", "平坦", 0.593, "否"],
    [17, "青绿", "蜷缩", "沉闷", "稍凹", 0.719, "否"],
]
valid = [
    [4, "青绿", "蜷缩", "沉闷", "凹陷", 0.608, "是"],
    [5, "浅白", "蜷缩", "浊响", "凹陷", 0.556, "是"],
    [8, "乌黑", "稍蜷", "浊响", "稍凹", 0.437, "是"],
    [9, "乌黑", "稍蜷", "沉闷", "稍凹", 0.666, "否"],
    [11, "浅白", "硬挺", "清脆", "平坦", 0.245, "否"],
    [12, "浅白", "蜷缩", "浊响", "平坦", 0.343, "否"],
    [13, "青绿", "稍蜷", "浊响", "凹陷", 0.639, "否"],
]
col = {a: i + 1 for i, a in enumerate(attrs)}
# 多个属性得分相同时的优先顺序（与教材《机器学习》4.3节一致，优先选择“脐部”）
priority = ["脐部", "色泽", "根蒂", "敲声", "密度"]
values = {a: list(dict.fromkeys(r[col[a]] for r in train + valid)) for a in attrs if a not in continuous}


# ---------------- 基本度量 ----------------
def gini(rows):
    n = len(rows)
    return 1 - sum((c / n) ** 2 for c in Counter(r[-1] for r in rows).values()) if n else 0.0


def entropy(rows):
    n = len(rows)
    return abs(-sum(c / n * log2(c / n) for c in Counter(r[-1] for r in rows).values())) if n else 0.0


def majority(rows):
    cnt = Counter(r[-1] for r in rows)
    return "是" if cnt["是"] >= cnt["否"] else "否"


def split(rows, a, t=None):
    """按属性 a 划分，返回 [(分支名, 子集)]"""
    i = col[a]
    if a in continuous:
        return [(f"≤{t:.4f}", [r for r in rows if r[i] <= t]),
                (f">{t:.4f}", [r for r in rows if r[i] > t])]
    return [(v, [r for r in rows if r[i] == v]) for v in values[a]]


def evaluate(rows, a, criterion):
    """返回 (得分, 划分点)，得分越大越好：信息增益 或 负的基尼指数"""
    n = len(rows)
    imp = entropy if criterion == "gain" else gini

    def score(parts):
        s = sum(len(sub) / n * imp(sub) for _, sub in parts)
        return entropy(rows) - s if criterion == "gain" else -s

    if a in continuous:
        vs = sorted({r[col[a]] for r in rows})
        best = (float("-inf"), None)
        for t in [(vs[k] + vs[k + 1]) / 2 for k in range(len(vs) - 1)]:
            s = score(split(rows, a, t))
            if s > best[0] + 1e-12:
                best = (s, t)
        return best
    return score(split(rows, a)), None


def choose(rows, avail, criterion, ind=""):
    usable = [a for a in avail if len({r[col[a]] for r in rows}) > 1]
    if not usable:
        return None, None
    scores = {a: evaluate(rows, a, criterion) for a in usable}
    name = "Gain" if criterion == "gain" else "Gini_index"
    print(ind + "  " + "，".join(
        f"{name}({a})={abs(s):.4f}" + (f"[t={t:.4f}]" if t is not None else "")
        for a, (s, t) in scores.items()))
    best = max(usable, key=lambda a: (round(scores[a][0], 10), -priority.index(a)))
    return best, scores[best][1]


# ---------------- 树结构 ----------------
def leaf(rows, parent_rows=None):
    return {"叶": majority(rows if rows else parent_rows), "rows": rows or []}


def predict(node, r):
    while "叶" not in node:
        a, t = node["属性"], node["t"]
        if a in continuous:
            node = node["分支"][f"≤{t:.4f}" if r[col[a]] <= t else f">{t:.4f}"]
        else:
            node = node["分支"][r[col[a]]]
    return node["叶"]


def accuracy(tree, rows):
    return sum(predict(tree, r) == r[-1] for r in rows) / len(rows)


def count(node):
    """返回 (节点总数, 叶节点数, 深度)"""
    if "叶" in node:
        return 1, 1, 0
    stats = [count(c) for c in node["分支"].values()]
    return 1 + sum(s[0] for s in stats), sum(s[1] for s in stats), 1 + max(s[2] for s in stats)


def label(node):
    a = node["属性"]
    return f"{a}≤{node['t']:.4f}?" if a in continuous else a


def show(node, prefix=""):
    items = list(node["分支"].items())
    for k, (v, c) in enumerate(items):
        last = k == len(items) - 1
        br = "└── " if last else "├── "
        if "叶" in c:
            print(f"{prefix}{br}{v} → {'好瓜' if c['叶'] == '是' else '坏瓜'}")
        else:
            print(f"{prefix}{br}{v} → [{label(c)}]")
            show(c, prefix + ("    " if last else "│   "))


def print_tree(tree):
    if "叶" in tree:
        print(f"（单叶节点）→ {'好瓜' if tree['叶'] == '是' else '坏瓜'}")
    else:
        print(f"[{label(tree)}]")
        show(tree)


def to_json(node):
    if "叶" in node:
        return node["叶"]
    return {"属性": label(node), "分支": {k: to_json(c) for k, c in node["分支"].items()}}


def ids(rows):
    return "{" + ",".join(str(r[0]) for r in rows) + "}"


# ---------------- 生成完整（未剪枝）树 ----------------
def build_full(rows, avail, criterion, depth=0, cond="根节点"):
    ind = "    " * depth
    print(f"{ind}▶ {cond}：{ids(rows)}")
    if len({r[-1] for r in rows}) == 1:
        print(f"{ind}  → 叶节点：{rows[0][-1]}")
        return leaf(rows)
    a, t = choose(rows, avail, criterion, ind)
    if a is None:
        print(f"{ind}  → 无可用属性，叶节点：{majority(rows)}")
        return leaf(rows)
    print(f"{ind}  ⇒ 选择 {a}" + (f" ≤ {t:.4f}" if t is not None else ""))
    rest = avail if a in continuous else [x for x in avail if x != a]
    node = {"属性": a, "t": t, "rows": rows, "分支": {}}
    for v, sub in split(rows, a, t):
        if sub:
            cond = f"{a}{v}" if a in continuous else f"{a}={v}"
            node["分支"][v] = build_full(sub, rest, criterion, depth + 1, cond)
        else:
            print(f"{ind}    ▶ {a}={v}：无训练样本 → 叶节点（父节点多数类）：{majority(rows)}")
            node["分支"][v] = leaf([], rows)
    return node


# ---------------- 预剪枝 ----------------
def build_prepruned():
    root = leaf(train)
    root["avail"] = attrs
    queue = [(root, None, None)]  # (节点, 父节点, 分支名)，广度优先
    tree = root
    while queue:
        node, parent, key = queue.pop(0)
        rows = node["rows"]
        print(f"▶ 节点 {ids(rows)}（当前标记为“{node['叶']}”）")
        if len({r[-1] for r in rows}) == 1:
            print("  样本全属于同一类，不再划分\n")
            continue
        a, t = choose(rows, node["avail"], "gini")
        if a is None:
            print("  无可用属性，不再划分\n")
            continue
        before = accuracy(tree, valid)
        rest = node["avail"] if a in continuous else [x for x in node["avail"] if x != a]
        new = {"属性": a, "t": t, "rows": rows, "分支": {}}
        for v, sub in split(rows, a, t):
            child = leaf(sub, rows)
            child["avail"] = rest
            new["分支"][v] = child
        cand = new if parent is None else tree
        if parent is not None:
            parent["分支"][key] = new
        after = accuracy(cand, valid)
        name = f"{a}" + (f"≤{t:.4f}" if t is not None else "")
        print(f"  按“{name}”划分：划分前验证集精度 {before:.2%}，划分后 {after:.2%}", end="")
        if after > before + 1e-12:
            print(" → 精度提高，进行划分\n")
            tree = cand
            for v, c in new["分支"].items():
                if c["rows"]:
                    queue.append((c, new, v))
        else:
            print(" → 精度未提高，禁止划分（剪枝）\n")
            if parent is not None:
                parent["分支"][key] = node
    return tree


# ---------------- 后剪枝 ----------------
def postprune(tree):
    def internal_nodes(node, parent=None, key=None, depth=0, out=None):
        out = [] if out is None else out
        if "叶" not in node:
            out.append((depth, node, parent, key))
            for k, c in node["分支"].items():
                internal_nodes(c, node, k, depth + 1, out)
        return out

    nodes = internal_nodes(tree)
    nodes.sort(key=lambda x: -x[0])  # 自底向上：从最深的内部节点开始考察
    for depth, node, parent, key in nodes:
        before = accuracy(tree, valid)
        lf = leaf(node["rows"])
        if parent is None:
            after = accuracy(lf, valid)
        else:
            parent["分支"][key] = lf
            after = accuracy(tree, valid)
        name = label(node)
        print(f"▶ 考察节点[{name}] {ids(node['rows'])}：剪枝前验证集精度 {before:.2%}，"
              f"替换为叶节点“{lf['叶']}”后 {after:.2%}", end="")
        if after > before + 1e-12:
            print(" → 精度提高，剪枝")
            if parent is None:
                tree = lf
        else:
            print(" → 精度未提高，保留")
            if parent is not None:
                parent["分支"][key] = node
    return tree


print(f"训练集：{ids(train)}   验证集：{ids(valid)}\n")

print("=" * 18 + " 一、未剪枝决策树（信息增益，训练集） " + "=" * 18)
tree_gain = build_full(train, attrs, "gain")
print()
print_tree(tree_gain)

print("\n" + "=" * 18 + " 二、未剪枝决策树（基尼指数，训练集） " + "=" * 18)
tree_gini = build_full(train, attrs, "gini")
print()
print_tree(tree_gini)

print("\n" + "=" * 22 + " 三、预剪枝决策树（基尼指数） " + "=" * 22)
tree_pre = build_prepruned()
print_tree(tree_pre)

print("\n" + "=" * 22 + " 四、后剪枝决策树（基尼指数） " + "=" * 22)
tree_post = postprune(copy.deepcopy(tree_gini))
print()
print_tree(tree_post)


def pad(s, w):
    s = str(s)
    return s + " " * (w - sum(2 if ord(ch) > 127 else 1 for ch in s))


print("\n" + "=" * 28 + " 五、比较 " + "=" * 28)
print(pad("决策树", 30) + pad("节点数", 8) + pad("叶节点", 8) + pad("深度", 6)
      + pad("训练集精度", 12) + "验证集精度")
for name, t in [("未剪枝（信息增益）", tree_gain), ("未剪枝（基尼指数）", tree_gini),
                ("预剪枝（基尼指数）", tree_pre), ("后剪枝（基尼指数）", tree_post)]:
    n, l, d = count(t)
    print(pad(name, 30) + pad(n, 8) + pad(l, 8) + pad(d, 6)
          + pad(f"{accuracy(t, train):.2%}", 12) + f"{accuracy(t, valid):.2%}")

print("\n结论：")
print("1. 未剪枝决策树在训练集上精度为100%，但验证集精度只有"
      f"{accuracy(tree_gain, valid):.2%}，存在过拟合；")
print(f"2. 预剪枝决策树只有{count(tree_pre)[0]}个节点，验证集精度提高到{accuracy(tree_pre, valid):.2%}，"
      "训练时间开销小，但有欠拟合的风险；")
print(f"3. 后剪枝决策树保留了更多分支（{count(tree_post)[0]}个节点），验证集精度为{accuracy(tree_post, valid):.2%}，"
      "欠拟合风险小，泛化性能一般优于预剪枝，但训练时间开销更大。")

json.dump({"未剪枝（信息增益）": to_json(tree_gain), "未剪枝（基尼指数）": to_json(tree_gini),
           "预剪枝（基尼指数）": to_json(tree_pre), "后剪枝（基尼指数）": to_json(tree_post)},
          open("hw4_trees.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
