const notice = (msg) => new Notice(msg, 5000);

const parseDOMFormString = (html) => {
  return new DOMParser().parseFromString(html, "text/html");
};

const requestHtmlDoc = async (url) => {
  const response = await request({ url });
  return parseDOMFormString(response);
};

const searchBooks = async (keyword) => {
  try {
    const html = await requestHtmlDoc(
      "https://m.yes24.com/Search?query=" + encodeURI(keyword)
    );
    const findBookList = html.querySelectorAll("#yesSchGList > .item");
    return Array.from(findBookList)
      .map((item) => {
        const type = item.querySelector(".gd_res").innerText;
        if (!/도서|eBook|외서/i.test(type)) {
          return null;
        }
        const linkItem = item.querySelector("a.lnk_item");
        return {
          type,
          title: linkItem.innerText.replace(/(\s이동)$/gi, ""),
          link: linkItem.getAttribute("href"),
          author: item.querySelector(".info_auth").innerText,
          publisher: item.querySelector(".info_pub").innerText,
        };
      })
      .filter((is) => is);
  } catch (err) {
    console.log(err);
  }
  return "";
};

const getBookInfo = async (bookUrl) => {
  try {
    const infoLink = "https://m.yes24.com" + bookUrl;
    const doc = await requestHtmlDoc(infoLink);

    const title = doc
      .querySelector("h2.gd_name")
      .innerText.replace(":", "：")
      .replace("?", "？")
      .trim();

    const authors = Array.from(doc.querySelectorAll(".gd_auth a")).map((val) =>
      val.innerText.trim()
    );

    const totalPage =
      parseInt(
        Array.from(doc.querySelectorAll("#goods_itemInfo td"))
          .map((td) => /\d+쪽/.exec(td.innerText)?.[0])
          .find((e) => e),
        10
      ) || 0;

    const publisher = doc.querySelector(".gd_pub").innerText.trim();
    const publishedDate = moment(
      doc.querySelector(".gd_date").innerText.trim(),
      "yyyy년 MM월 DD일"
    ).format("yyyy-MM-DD");

    const thumbnail = doc.querySelector(".gd_imgGrp img").getAttribute("src");
    const smallThumbnail = thumbnail.replace("/XL", "/S");
    const mediumThumbnail = thumbnail.replace("/XL", "/M");
    const largeThumbnail = thumbnail.replace("/XL", "/L");

    const categories = [
      ...new Set(
        Array.from(doc.querySelectorAll(".infoSetCont_alertLi li a"))
          .map((val) => val.innerText.trim())
          .filter((val) => !/선물|위로|응원/.test(val))
      ),
    ];

    const rating = doc.querySelector(".gd_rating .yes_b").innerText.trim();

    const isbn = doc
      .querySelector(".infoSetCont")
      ?.innerText.match(/(?<isbn13>\w{13})[^]*(?<isbn10>\w{10})/)?.groups || {
      isbn10: "",
      isbn13: "",
    };

    const results = {
      title,
      authors,
      categories,
      totalPage,
      publisher,
      publishedDate,
      thumbnail,
      smallThumbnail,
      mediumThumbnail,
      largeThumbnail,
      infoLink,
      rating,
      ...isbn,
    };
    console.log(results)

    return results;
  } catch (err) {
    console.log(err);
  }
  return {};
};

const replaceIllegalFileNameCharactersInString = (str) => {
  return str
    .replace(/[\\,#%&\{\}\/*<>?$\'\":@\[\]\|]*/g, "")
    .replace(/\s{2,}/g, " ");
};

module.exports = async function (plugin) {
  console.log("Starting...");
  const query = await plugin.quickAddApi.inputPrompt(
    "제목, 저자, 출판사, ISBN 검색"
  );
  if (query) {
    const books = await searchBooks(query);
    if (!books) {
      return notice(`"${query}" was not found`);
    }

    const pickedBook = await plugin.quickAddApi.suggester(
      ({ type, title, author, publisher }) =>
        `${type} ${title}\n${author}, ${publisher}`,
      books
    );

    const book = await getBookInfo(pickedBook.link);
    console.log(book);

    plugin.variables = {
      ...book,
      fileName: replaceIllegalFileNameCharactersInString(book.title),
      author: book.authors[0],
      category: book.categories[1],
    };
  }
};
