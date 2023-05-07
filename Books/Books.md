---
banner: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?&fit=crop&w=1828&q=80"
banner_y: 0.1
obsidianUIMode: preview
obsidianEditingMode: live
cssClasses: row-alt, table-small, col-lines, row-lines
---
```button
name 책 추가하기
type command
action QuickAdd: 책 검색
```

# 🟦 읽고 있는 책: Reading
```dataview
TABLE without id
link(file.link, title) as 도서명,
category as 분류,
author as 저자,
dateformat(started, "DD") as 시작일
FROM #📚Book
WHERE (status = "reading" or status = "읽는중")
SORT started DESC
```

# 🟧 읽을 책: To Read
```dataview
TABLE without id
link(file.link, title) as 도서명,
category as 분류,
author as 저자
FROM #📚Book
WHERE (!status or status = "toread" or status = "읽기전") and !contains(file.path, "Templates")
SORT file.cday ASC
```

# 🟨 읽기 중단한 책: Stop Reading
```dataview
TABLE without id
link(file.link, title) as 도서명,
category as 분류,
author as 저자,
dateformat(started, "DD") as 시작일
FROM #📚Book
WHERE (status = "stop" or status = "읽기중단")
SORT started DESC
```

# 🟩 읽기 완료한 책: Completed
```dataview
TABLE without id
link(file.link, title) as 도서명,
category as 분류,
author as 저자,
dateformat(started, "DD") as 시작일,
dateformat(completed, "DD") as 완료일
FROM #📚Book
WHERE (status = "completed" or status = "읽기완료")
SORT completed DESC
```
