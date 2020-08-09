---
title: 在Archlinux下交叉编译mentohust
author: "Kepontry"
tags: ["Archlinux", "mentohust","交叉编译"]
categories: ["Linux"]
date: 2020-08-09
---

## 编译环境

- 操作系统：Archlinux x86_64
- 目标系统：博通ARM核的路由
- 内核版本：5.7.10-arch1-1
- 编译工具链：[hndtools-arm-linux-2.6.36-uclibc-4.5.3](http://www.belkin.com/support/dl/EA6200_v1.1.41.164830-Build15.tar.gz)


## 关于本文

本文是作者根据U大的[交叉编译教程](https://koolshare.cn/thread-43133-1-1.html)进行的一次探索，主要是为了学习交叉编译相关知识，编译生成的mentohust文件未在路由器上进行测试。如果想要完整的路由器解决方案，我在网上也找到一篇[很好的教程](https://www.viseator.com/2017/09/05/mr12u_openwrt_mentohust/)。由于作者是第一次接触交叉编译，文中若有错误，还请大家指正。

## 编译过程

### 文件准备

- 编译工具链：[hndtools-arm-linux-2.6.36-uclibc-4.5.3](http://www.belkin.com/support/dl/EA6200_v1.1.41.164830-Build15.tar.gz)

  这个文件有500多MB，而且下载速度比较慢，我是在Windows下使用XDM下载后，再通过U盘将文件转移到Archlinux下的。下载的文件名为**EA6200_v1.1.41.164830-Build15**，在该文件夹的/src/arm-brcm-linux-uclibcgnueabi目录下有一个**hndtools-arm-linux-2.6.36-uclibc-4.5.3.tar.bz2**文件，这就是本次编译用到的工具链。

- mentohust

  ```shell
  git clone https://github.com/updateing/mentohust.git
  ```
  
- libpcap（建议寻找早期版本）

  ```shell
  git clone https://github.com/the-tcpdump-group/libpcap.git
  ```

- libiconv

  ```shell
  wget -4 http://ftp.gnu.org/gnu/libiconv/libiconv-1.14.tar.gz
  ```

### 开始编译

#### libpcap

首先将工具链的bin文件夹加入环境变量，让系统能够找到工具链。注意，export命令设置的环境变量仅在当前shell窗口下有效，若关闭窗口，需再次执行该命令。如果嫌麻烦也可以把命令写进.bashrc里，再source一下。


```shell
export PATH=$PATH:/home/gabon/Desktop/Work/hndtools-arm-linux-2.6.36-uclibc-4.5.3/bin # 此处需换成自己工具链文件夹
```

接下来通过运行./configure……生成Makefile

```shell
 ./configure --host=arm-brcm-linux-uclibcgnueabi --with-pcap=linux
```

这里遇到第一个报错，报错信息忘记截下来了，大致就是显示工具链bin目录下的某个文件No such file or directory，大概连着有十几个都是这样的错。第一个错指向的是arm-brcm-linux-uclibcgnueabi-gcc文件，但是目录下的确有这个文件，直接执行该文件也显示No such file or directory，由此排除工具链问题。通过搜索找到了[原因](https://blog.csdn.net/sun927/article/details/46593129)，**我的系统是64位的，而工具链中的程序是32位的，在64位系统上与运行32位程序，需要安装32位lib库**。

```shell
uname -a # 查询系统信息
Linux Arch 5.7.10-arch1-1 #1 SMP PREEMPT Wed, 22 Jul 2020 19:57:42 +0000 x86_64 GNU/Linux

file ./arm-brcm-linux-uclibcgnueabi-gcc # 查询该文件信息
./arm-brcm-linux-uclibcgnueabi-gcc: ELF 32-bit LSB executable, Intel 80386, version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux.so.2, for GNU/Linux 2.6.9, not stripped
```

archlinux 64位上运行32位程序的解决办法可以参考[这篇文章](https://blog.csdn.net/cnsword/article/details/7447670)，我的做法如下

```shell
# 在/etc/pacman.conf中增加
[multilib]
Include = /etc/pacman.d/mirrorlist
# 同步包数据库
sudo pacman -Sy 
# 安装lib32-glibc库
sudo pacman -S lib32-glibc
```

再次运行./configure……，遇到第二个报错，显示libmpc.so.2，No such file or directory. 

```shell
# 查找该文件，发现文件在工具链的lib文件夹下
cd /
sudo find . -name libmpc.so.2 
# 输出结果
./home/gabon/Desktop/Work/hndtools-arm-linux-2.6.36-uclibc-4.5.3/lib/libmpc.so.2
```

该问题在stackoverflow上找到了[答案](https://stackoverflow.com/questions/19625451/cc1-error-while-loading-shared-libraries-libmpc-so-2-cannot-open-shared-objec)，是**因为未将动态链接库所在目录加入LD_LIBRARY_PATH变量中，导致找不到libmpc.so.2**，解决方案如下。

```shell
# 在LD_LIBRARY_PATH原有值下增加一条
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/home/gabon/Desktop/Work/hndtools-arm-linux-2.6.36-uclibc-4.5.3/lib # 此处需换成自己工具链文件夹
# 刷新动态链接库列表
sudo ldconfig
```

再次运行./configure……，接着报错，找不到动态链接库libelf.so.1

```shell
# 报错信息
error while loading shared libraries: libelf.so.1: cannot open shared object file: No such file or directory
```

先看看这个文件在哪

```shell
sudo find . -name libelf.so.1
# 输出结果
./usr/lib/libelf.so.1
```

将/usr/lib加入**LD_LIBRARY_PATH**变量中后运行./configure……，再次遇到报错

```shell
# 报错信息
error while loading shared libraries: libelf.so.1: wrong ELF class: ELFCLASS64
```

CSDN上的[一篇教程](https://blog.csdn.net/mifangdebaise/article/details/44942395)解释了原因

> 安装软件时出现问题  ×.so.×:wrong ELF class: ELFCLASS64 ，大致的意思是软件是32位的，需要32位的 ×.so.×动态链接库，而系统是64位的所提供的该 动态链接库×.so.×是64位的，所以不能用。
>

也就是说，找到的libelf.so.1动态链接库文件是在/usr/lib下的，是64位的，我们仍然需要安装含有32位动态链接库libelf.so.1的包lib32-libelf

```shell
# lib32-libelf 位于multilib仓库中
sudo pacman -S lib32-libelf
# 将/usr/lib32加入LD_LIBRARY_PATH变量
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/lib32

sudo ldconfig
```

最后，运行./configure……，跑出一大串东西，却仍然失败了。

```shell
# 报错信息
checking for libnl-genl-3.0 with pkg-config... not found
checking for nl_socket_alloc in -lnl-3... no
configure: error: libnl support requested but libnl not found
```

大致意思是用pkg-config找不到libnl-genl-3.0这个模块，但是我在zsh中用pkg-config命令是可以找到这个模块的，并且能够正确输出它的lib文件夹

```shell
pkg-config libnl-genl-3.0 -libs 
# 输出
-L/usr/lib32 -lnl-genl-3 -lnl-3 
```

最后到Github上查看了一下它的仓库，发现最后一次更新在19小时前，因为当时文件是直接clone下来的，觉得可能会不稳定。于是便下载了2016年的[libpcap-1.8.0](https://github.com/the-tcpdump-group/libpcap/releases/tag/libpcap-1.8.0)版本进行编译，结果成功生成Makefile，运行make命令后在当前文件夹下生成libpcap.a文件。

> 选择2016年的版本是因为这个版本发布时间接近U大写的这篇教程的时间，出错的可能性最小，但是这个版本好像没有用到libnl-genl-3.0，所以之前的bug的出现原因也无从知晓。

#### libiconv

因为是同一个shell，所以不需要再次export PATH，直接按照U大教程走就行，生成的库文件为./lib/.libs/libiconv.a

```shell
# 生成Makefile
./configure --host=arm-brcm-linux-uclibcgnueabi --enable-static=yes
# 编译
 make 
```

#### mentohust

```shell
 # 生成configure文件
 ./autogen.sh 
 # 给变量赋值
 LIBS=/home/gabon/Desktop/Work/libiconv-1.14/lib/.libs/libiconv.a # 根据自身情况修改
 # 生成Makefile
 ./configure --host=arm-brcm-linux-uclibcgnueabi --with-pcap=/home/gabon/Downloads/libpcap-libpcap-1.8.0/libpcap.a --disable-notify # 根据自身情况修改
 # 编译
 make
 # 查看生成文件属性
 file mentohust
```

从如下信息中可以看出，该文件适用于ARM核的32位系统，并且not stripped

```shell
# 输出信息
 mentohust: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), dynamically linked, interpreter /lib/ld-uClibc.so.0, with debug_info, not stripped
```

## 总结

因为是抱着边学习边编译的态度，所以大概花了我两天时间，在各个平台上学习基础知识、寻找解决办法，总的来说收获挺大的，了解了链接库和编译的相关知识。同时也感觉到影响交叉编译的因素太多了，工具链，编译环境，各依赖库的版本……调试这些报错信息需要懂得原理、根据报错信息合理的进行搜索、对搜索结果进行选择性的吸收并进行测试。虽然最后通过编译旧版的libpcap解决了问题，但接下来我也会在Ubuntu下或者运用别的工具链再次进行尝试。