#!/usr/bin/env python
# -*- encoding: utf-8 -*-

"""
@file           :imageCollection.py
@Description    :实验一 图像数据集采集 (按空格保存图片, ESC 退出)
@Date           :2023/07/07 09:20:31
@Autor          :Hjc
@Version        :v1.0
"""
import cv2
import os


# 摄像头

def video(capture):

    index = 0  # 用于记录照片张数
    codec = cv2.VideoWriter_fourcc("M", "J", "P", "G")  # 设置视频图像格式
    capture.set(cv2.CAP_PROP_FOURCC, codec)
    capture.set(cv2.CAP_PROP_FPS, 50)  # 设置帧率

    capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    # 创建窗口
    cv2.namedWindow("frame", cv2.WINDOW_NORMAL)
    # 设置窗口大小
    cv2.resizeWindow("frame", 640, 480)

    # 创建用于储存照片的文件夹
    saveDir = "../../res/images/sample"
    if not os.path.exists(saveDir):
        os.makedirs(saveDir)

    while True:
        ret, frame = capture.read()
        # 检查是否成功读取视频帧
        if not ret:
            break

        frame = cv2.flip(frame, 0)  # 手机画面水平翻转

        # 执行旋转
        # frame = cv2.rotate(frame, cv2.ROTATE_180)

        # 每帧只读取一次按键, 避免两次 waitKey 丢失按键
        key = cv2.waitKey(1) & 0xFF
        if key == 32:  # 按下空格保存图片
            path = "{}/{}.jpg".format(saveDir, index)
            cv2.imwrite(path, frame)
            print("saveimage: {}.jpg".format(index))
            index += 1
        elif key == 27:  # 按下ESC退出程序
            break

        cv2.putText(  # 将已获取的照片数量打印到屏幕上
            frame,
            str(index),
            (10, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            5,
            (0, 0, 254),
            3,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            "Please press [space] to collect imgs!",
            (20, 450),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )
        cv2.imshow("frame", frame)  # UI显示

    # 释放资源
    capture.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":

    # 打开摄像头
    capture = cv2.VideoCapture("/dev/video0")
    video(capture)
