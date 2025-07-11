---
title: "shadcn/uiでdarkmodeに切り替えるときのHydration errorを解決する方法"
summary: "参考にした記事をただ紹介するだけ"
tags: ["Next.js", "Web", "Webアプリ開発", "個人開発", "shadcn/ui"]
---

`theme-provider.tsx`を

```tsx
"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useEffect, useState } from "react";

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return (
    mounted && <NextThemeProvider {...props}>{children}</NextThemeProvider>
  );
};
```

のようにすればよいらしい．このようにしたら治った．

参考
[DarkMode切替時でのHydration errorの対応策](https://zenn.dev/dk_/articles/dd9b0426e58f7d)
