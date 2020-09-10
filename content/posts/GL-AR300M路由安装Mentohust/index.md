---
title: GL-AR300M路由安装Mentohust
slug: GL-AR300M-Mentohust
author: "Kepontry"
tags: ["路由器", "mentohust","交叉编译"]
categories: ["Linux"]
date: 2020-09-06
---

其实主要的交叉编译步骤在[上一篇文章中](https://blog.kepontry.cn/posts/2020/archlinux-crosscompile-mentohust/)已经介绍过了，这里主要介绍一下将编译好的Mentohust传入路由器中并运行。

## 环境与用到的工具

路由器：GL-AR300M

路由器系统：OpenWrt 18.06.1

工具链：[openwrt-sdk-18.06.1-ar71xx-generic_gcc-7.3.0_musl.Linux-x86_64.tar.xz](https://archive.openwrt.org/releases/18.06.1/targets/ar71xx/generic/openwrt-sdk-18.06.1-ar71xx-generic_gcc-7.3.0_musl.Linux-x86_64.tar.xz)

libpcap插件：[libpcap_1.9.1-1_mips_24kc.ipk](https://archive.openwrt.org/releases/18.06.1/packages/mips_24kc/base/libpcap_1.9.1-1_mips_24kc.ipk)

> 注意：此处使用的工具链与上一篇教程中使用的不同
>

## 过程

因为我的路由器出厂自带OpenWrt系统，所以就免去了刷不死ROOT和OpenWrt的过程，直接把编译好的mentohust上传即可。这个过程主要的工作量在于找与自己路由器型号匹配的工具链和libpcap插件。

### 编译libpcap动态链接库

使用`export PATH=$PATH:`设置PATH变量，我用的这个工具链还需要设置staging_dir变量（好像是叫这个名字），然后运行./configure，加入host和with-pcap参数（我这里的host参数为mips-openwrt-linux，与参考教程中不一致），生成Makefile. 最后make编译即可。

### 编译mentohust

这里和之前的[文章](https://blog.kepontry.cn/posts/2020/archlinux-crosscompile-mentohust/)中的步骤基本一致，此处不再赘述。

### 安装libpcap插件

一开始我打算自己编译libpcap的.ipk插件，后来发现archive.openwrt.org中有已经做好的插件，就直接用了。

### 在路由器上安装

使用scp将libpcap插件和mentohust都上传至服务器，使用opkg install命令安装插件，最后使用./mentohust -u 用户名 -p 密码 -n eth0 -b1命令启动mentohust，大功告成。

> 由于文章写于安装完成后一周左右，写的比较简略，姑且当作一篇安装记录吧！ 

## 参考教程

[TP-Link mr12u-v1刷openwrt+mentohust交叉编译](https://www.viseator.com/2017/09/05/mr12u_openwrt_mentohust/)

