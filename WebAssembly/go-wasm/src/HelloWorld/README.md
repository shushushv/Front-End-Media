# go wasm 环境搭建

## golang 安装
通过 [官方地址](https://golang.org/dl/) 下载。MacOS 也可通过 `brew` 快速安装：
```
$ brew install golang

$ go version
go version go1.17.2 darwin/arm64
```

## golang 环境测试
新建文件 `main.go`，写入：
```golang
package main

import "fmt"

func main() {
  fmt.Println("Hello World!")
}
```
执行 `go run main.go` ，将输出：
```
$ go run main.go
Hello World!
```
> 如果启用了 `GO MODULES` ，则需要使用 `go mode init` 初始化模块，或设置 `GO111MODULE=auto`。

## 将 golang 打包为 WASM
通常有两种打包方式，一种是 golang 自带的，另外是使用 `tinygo`。推荐使用 `tinygo`，因为编译出的 wasm 模块更小。

- 使用 golang 原生编译
  
  在编译 `wasm` 模块前，需要设置 golang 交叉编译参数，目标系统 `GOOS=js` 和目标架构 `GOARCH=wasm`，编译 wasm 模块：
  ```
  // macos
  $ GOOS=js GOARCH=wasm go build -o main.wasm

  // windows 临时设置 golang 环境参数（仅作用于当前CMD）
  $ set GOOS=js 
  $ set GOARCH=wasm
  $ go build -o main.wasm
  ```

- 使用 tinygo 编译
  
  直接按照[官方文档](https://tinygo.org/getting-started/install/)安装即可，MacOS 如下：
  ```
  $ brew tap tinygo-org/tools
  $ brew install tinygo

  $ tinygo version
  tinygo version 0.20.0 darwin/amd64 (using go version go1.17.2 and LLVM version 11.0.0)
  ```
  使用以下命令对 `main.go` 再次进行打包：
  ```
  $ tinygo build -o main-tiny.wasm
  ```

- 打包文件大小对比
  ```
  $ du -sh ./*.wasm
  228K    ./main-tiny.wasm
  1.9M    ./main.wasm
  ```

## 在浏览器中跑起来
要想在浏览器中跑 `main.wasm` ，首先需要 JS 胶水代码，golang 已经为我们提供了，直接复制过来。需要注意的是，使用 `tinygo` 和 原生编译的胶水代码是有差异的，根据具体情况拷贝对应的：

```
// 原生编译
$ cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .

// tinygo编译
$ cp "$(tinygo env TINYGOROOT)/targets/wasm_exec.js" ./wasm_exec_tiny.js
```

其次，需要一个 `HTML` 入口文件，创建 `index.html` 文件，并写入以下代码：
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="./wasm_exec_tiny.js"></script>
</head>
<body>
  <script>
    const go = new Go(); // wasm_exec.js 中的定义
    WebAssembly.instantiateStreaming(fetch('./main-tiny.wasm'), go.importObject)
      .then(res => {
        go.run(res.instance); // 执行 go main 方法
      });
  </script>
</body>
</html>
```

最后，起一个 **http server** 让它跑起来吧～
```
// python
$ python3 -m http.server
$ python2 -m SimpleHTTPServer

// node
$ npm i -g http-server
$ hs

// gp
$ go get -u github.com/shurcooL/goexec
$ goexec 'http.ListenAndServe(`:8080`, http.FileServer(http.Dir(`.`)))'
```

## 异常记录
- 通过 node 的 http-server 起的服务，加载会报错:

  ```
  > TypeError: Failed to execute 'compile' on 'WebAssembly': Incorrect response MIME type. Expected 'application/wasm'.
  ```
  
  原因是 wasm 文件响应头的 **content-type** 为 `application/wasm; charset=utf-8`，应该为 `application/wasm`。已知的解决方法为修改 HTML 中 wasm 的初始化方式为：

  ```js
  fetch('./main-tiny.wasm')
    .then(res => res.arrayBuffer())
    .then(buffer => {
      WebAssembly.instantiate(buffer, go.importObject)
        .then(res => {
          go.run(res.instance);
        })
    })
  ```