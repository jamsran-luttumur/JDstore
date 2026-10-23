# 根据 hw3_tree.json / hw4_trees.json 绘制决策树图片
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

font_manager.fontManager.addfont("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc")
plt.rcParams["font.family"] = "WenQuanYi Zen Hei"
plt.rcParams["axes.unicode_minus"] = False


def leaves(node):
    return 1 if not isinstance(node, dict) else sum(leaves(c) for c in node["分支"].values())


def depth(node):
    return 0 if not isinstance(node, dict) else 1 + max(depth(c) for c in node["分支"].values())


def draw(tree, title, path):
    W, D = leaves(tree), max(depth(tree), 1)
    fig, ax = plt.subplots(figsize=(11, 1.7 * (D + 1) + 0.6))
    ax.set_axis_off()
    ax.set_xlim(0, W)
    ax.set_ylim(-0.6, D + 0.6)
    pos = [0]

    def place(node, d):
        y = D - d
        if not isinstance(node, dict):
            x = pos[0] + 0.5
            pos[0] += 1
            good = node == "是"
            ax.text(x, y, "好瓜" if good else "坏瓜", ha="center", va="center", fontsize=13,
                    bbox=dict(boxstyle="round,pad=0.45", fc="#d8f0d2" if good else "#f7d6d2",
                              ec="#3c8d2f" if good else "#b23b2e", lw=1.4))
            return x, y
        kids = [(v, place(c, d + 1)) for v, c in node["分支"].items()]
        x = (kids[0][1][0] + kids[-1][1][0]) / 2
        for v, (cx, cy) in kids:
            ax.annotate("", xy=(cx, cy + 0.22), xytext=(x, y - 0.22),
                        arrowprops=dict(arrowstyle="-|>", color="#555", lw=1.2))
            ax.text((x + cx) / 2, (y + cy) / 2, v, ha="center", va="center", fontsize=11,
                    color="#1f4e8c", bbox=dict(fc="white", ec="none", pad=1))
        ax.text(x, y, node["属性"], ha="center", va="center", fontsize=13,
                bbox=dict(boxstyle="square,pad=0.5", fc="#dbe8f7", ec="#1f4e8c", lw=1.4))
        return x, y

    if isinstance(tree, dict):
        place(tree, 0)
    ax.set_title(title, fontsize=15, pad=12)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print("已保存", path)


draw(json.load(open("hw3_tree.json", encoding="utf-8")), "作业3：基于信息增益的决策树", "images/hw3_tree.png")
names = {"未剪枝（信息增益）": "hw4_unpruned_gain", "未剪枝（基尼指数）": "hw4_unpruned_gini",
         "预剪枝（基尼指数）": "hw4_prepruned_gini", "后剪枝（基尼指数）": "hw4_postpruned_gini"}
for k, t in json.load(open("hw4_trees.json", encoding="utf-8")).items():
    draw(t, f"作业4：{k}决策树", f"images/{names[k]}.png")
