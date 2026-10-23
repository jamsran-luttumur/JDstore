# 作业1：计算各个属性的信息增益和信息增益率
from collections import Counter
from math import log2

attrs = ["年龄", "有工作", "有房", "信贷"]
data = [
    # 年龄, 有工作, 有房, 信贷, 类别
    ["青年", "否", "否", "一般", "否"],
    ["青年", "否", "否", "好", "否"],
    ["青年", "是", "否", "好", "是"],
    ["青年", "是", "是", "一般", "是"],
    ["青年", "否", "否", "一般", "否"],
    ["中年", "否", "否", "一般", "否"],
    ["中年", "否", "否", "好", "否"],
    ["中年", "是", "是", "好", "是"],
    ["中年", "否", "是", "非常好", "是"],
    ["中年", "否", "是", "非常好", "是"],
    ["老年", "否", "是", "非常好", "是"],
    ["老年", "否", "是", "好", "是"],
    ["老年", "是", "否", "好", "是"],
    ["老年", "是", "否", "非常好", "是"],
    ["老年", "否", "否", "一般", "否"],
]


def pad(s, w):
    """按显示宽度补齐（中文字符宽度为2）"""
    s = str(s)
    return s + " " * (w - sum(2 if ord(ch) > 127 else 1 for ch in s))


def entropy(labels):
    n = len(labels)
    return abs(-sum(c / n * log2(c / n) for c in Counter(labels).values()))


y = [row[-1] for row in data]
H_D = entropy(y)
print(f"样本总数 = {len(data)}，正例(是) = {y.count('是')}，反例(否) = {y.count('否')}")
print(f"数据集信息熵 Ent(D) = {H_D:.4f}\n")

results = []
for i, a in enumerate(attrs):
    col = [row[i] for row in data]
    n = len(col)
    cond = 0.0
    print(f"【{a}】")
    for v, cnt in Counter(col).items():
        sub = [row[-1] for row in data if row[i] == v]
        e = entropy(sub)
        cond += cnt / n * e
        print(f"   {a}={v}: {cnt}个样本（是{sub.count('是')}，否{sub.count('否')}），Ent = {e:.4f}")
    gain = H_D - cond
    iv = entropy(col)
    ratio = gain / iv
    results.append((a, gain, iv, ratio))
    print(f"   条件熵 = {cond:.4f}")
    print(f"   信息增益 Gain(D,{a}) = {H_D:.4f} - {cond:.4f} = {gain:.4f}")
    print(f"   固有值 IV({a}) = {iv:.4f}")
    print(f"   信息增益率 Gain_ratio(D,{a}) = {gain:.4f} / {iv:.4f} = {ratio:.4f}\n")

print("=" * 46)
print(pad("属性", 10) + pad("信息增益", 12) + pad("固有值IV", 12) + "信息增益率")
for a, g, iv, r in results:
    print(pad(a, 10) + pad(f"{g:.4f}", 12) + pad(f"{iv:.4f}", 12) + f"{r:.4f}")
print("=" * 46)
best_g = max(results, key=lambda t: t[1])
best_r = max(results, key=lambda t: t[3])
print(f"信息增益最大的属性：{best_g[0]}（{best_g[1]:.4f}）")
print(f"信息增益率最大的属性：{best_r[0]}（{best_r[3]:.4f}）")
