# 作业2：计算各个属性的 Gini 指数
from collections import Counter

attrs = ["色泽", "根蒂", "敲声", "纹理", "脐部", "触感"]
data = [
    # 色泽, 根蒂, 敲声, 纹理, 脐部, 触感, 好瓜
    ["青绿", "蜷缩", "浊响", "清晰", "凹陷", "硬滑", "是"],
    ["乌黑", "蜷缩", "沉闷", "清晰", "凹陷", "硬滑", "是"],
    ["乌黑", "蜷缩", "浊响", "清晰", "凹陷", "硬滑", "是"],
    ["青绿", "蜷缩", "沉闷", "清晰", "凹陷", "硬滑", "是"],
    ["浅白", "蜷缩", "浊响", "清晰", "凹陷", "硬滑", "是"],
    ["青绿", "稍蜷", "浊响", "清晰", "稍凹", "软粘", "是"],
    ["乌黑", "稍蜷", "浊响", "稍糊", "稍凹", "软粘", "是"],
    ["乌黑", "稍蜷", "浊响", "清晰", "稍凹", "硬滑", "是"],
    ["乌黑", "稍蜷", "沉闷", "稍糊", "稍凹", "硬滑", "否"],
    ["青绿", "硬挺", "清脆", "清晰", "平坦", "软粘", "否"],
    ["浅白", "硬挺", "清脆", "模糊", "平坦", "硬滑", "否"],
    ["浅白", "蜷缩", "浊响", "模糊", "平坦", "软粘", "否"],
    ["青绿", "稍蜷", "浊响", "稍糊", "凹陷", "硬滑", "否"],
    ["浅白", "稍蜷", "沉闷", "稍糊", "凹陷", "硬滑", "否"],
    ["乌黑", "稍蜷", "浊响", "清晰", "稍凹", "软粘", "否"],
    ["浅白", "蜷缩", "浊响", "模糊", "平坦", "硬滑", "否"],
    ["青绿", "蜷缩", "沉闷", "稍糊", "稍凹", "硬滑", "否"],
]


def pad(s, w):
    """按显示宽度补齐（中文字符宽度为2）"""
    s = str(s)
    return s + " " * (w - sum(2 if ord(ch) > 127 else 1 for ch in s))


def gini(labels):
    n = len(labels)
    return 1 - sum((c / n) ** 2 for c in Counter(labels).values())


y = [row[-1] for row in data]
print(f"样本总数 = {len(data)}，好瓜 = {y.count('是')}，坏瓜 = {y.count('否')}")
print(f"数据集基尼值 Gini(D) = 1 - (8/17)^2 - (9/17)^2 = {gini(y):.4f}\n")

results = []
for i, a in enumerate(attrs):
    col = [row[i] for row in data]
    n = len(col)
    gi = 0.0
    terms = []
    print(f"【{a}】")
    for v, cnt in Counter(col).items():
        sub = [row[-1] for row in data if row[i] == v]
        g = gini(sub)
        gi += cnt / n * g
        terms.append(f"{cnt}/{n}×{g:.4f}")
        p, q = sub.count("是"), sub.count("否")
        print(f"   {a}={v}: {cnt}个（是{p}，否{q}），"
              f"Gini = 1-({p}/{cnt})^2-({q}/{cnt})^2 = {g:.4f}")
    results.append((a, gi))
    print(f"   Gini_index(D,{a}) = {' + '.join(terms)} = {gi:.4f}\n")

print("=" * 30)
print(pad("属性", 10) + "Gini指数")
for a, g in results:
    print(pad(a, 10) + f"{g:.4f}")
print("=" * 30)
best = min(results, key=lambda t: t[1])
print(f"Gini指数最小的属性：{best[0]}（{best[1]:.4f}），应选为最优划分属性")
