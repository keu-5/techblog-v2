---
title: "Radix UIのdropdown menuを開くとscrollbarが消えてスタイルが変わるときの対処法"
summary: "記事がなかったので作る"
tags: ["Next.js", "Web", "Webアプリ開発", "shadcn/ui", "CSS"]
---

Radix UIのdropdown menuを開くときに，スクロールバーが消えてスタイルが変わってしまうことがあった．見栄えが悪いので修正しようとしたが記事がなく，修正に手間取ったのでここに修正方法を記す．

該当のコードは以下の通り．

```tsx
"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ThemeToggle = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();

  return (
    <>
      {children}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="
              fixed bottom-8 right-8 
              dark:text-gray-800 text-gray-200
              hover:dark:text-gray-700 hover:text-gray-200
              dark:bg-white bg-black
              hover:dark:bg-gray-100 hover:bg-gray-950
              dark:border-white border-black
            "
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="
            dark:text-gray-800 text-gray-200
            hover:dark:text-gray-700 hover:text-gray-200
            dark:bg-white bg-black
            hover:dark:bg-gray-100 hover:bg-gray-950
            border-none
          "
        >
          <DropdownMenuItem
            className="dark:hover:bg-gray-300 dark:hover:text-black"
            onClick={() => setTheme("light")}
          >
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            className="dark:hover:bg-gray-300 dark:hover:text-black"
            onClick={() => setTheme("dark")}
          >
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            className="dark:hover:bg-gray-300 dark:hover:text-black"
            onClick={() => setTheme("system")}
          >
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
```

ボタン要素が`fixed`だからおかしくなったのかなとは思うが`fixed`は使わざるを得ない．ちなみにレスポンシブでは同様のバグは発生しなかった．もちろんスクロールバーが出ない状態でも発生はしない．

修正方法は以下の通り．`grobals.css`にこれを追加するだけ．

```css
body[data-scroll-locked][data-scroll-locked] {
  overflow: auto !important;
  margin-right: 0 !important;
}
```

`data-scroll-locked`属性が2回付与された`body`要素に対して適用している．おそらくJSによってdata-scroll-lockedをbodyに付与することでスクロールを無効化しており，dropdown menuにその機能があったのではないかと推測している．

`[data-scroll-locked][data-scroll-locked]`のように2回付与された場合しか適用できなかった．

そしてこの時に`overflow: auto !important;`と`margin-right: 0 !important;`を指定している．

前者は要素がオーバーフローをしたときにスクロールバーを表示させるようにしているが，`!important`によってそれを優先的に適用させている．

このときになぜかbodyに`margin-right: 16px !important`が付与されるため，後者のように指定することでそれを無効化している．

参考
[shadcn/radix ui scrollbar removal bug](https://www.reddit.com/r/reactjs/comments/1fjcwkh/shadcnradix_ui_scrollbar_removal_bug/?rdt=60694)
