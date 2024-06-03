// JSONデータを取得する関数
function getJsonData(jsonUrl) {
  return new Promise((resolve, reject) => {
    $.getJSON(jsonUrl, function (data) {
      resolve(data);
    }).fail(function () {
      reject("Failed to load JSON file");
    });
  });
}

// CSVデータを取得する関数
async function fetchCsvData(fileName) {
  try {
    const response = await fetch(fileName);
    const text = await response.text();
    return parseCsv(text);
  } catch (error) {
    throw new Error("Failed to load CSV file:" + fileName);
  }
}

// CSVデータをパースする関数
function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n|\r/);
  const data = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const row = [];

    let insideQuotes = false;
    let value = "";

    for (let j = 0; j < line.length; j++) {
      const char = line.charAt(j);

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        row.push(value);
        value = "";
      } else {
        value += char;
      }
    }

    row.push(value);
    data.push(row);
  }

  return data;
}

// 配列をシャッフルして返す
function shuffle(array) {
  var result = [];
  for (i = array.length; i > 0; i--) {
    var index = Math.floor(Math.random() * i);
    var val = array.splice(index, 1)[0];
    result.push(val);
  }
  return result;
}

// 乱数生成
function getRamdomNumber(num) {
  return Math.floor(Math.random() * num);
}

// クッキー検索
function getCookie(name) {
  // クッキーの文字列を取得
  var cookies = document.cookie.split(";");

  // 各クッキーをループして指定された名前のクッキーを探す
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();

    // クッキーが指定された名前を持っているかどうかを確認
    if (cookie.startsWith(name + "=")) {
      // 指定された名前のクッキーが見つかったら、その値を返す
      return cookie.substring(name.length + 1);
    }
  }

  // 指定された名前のクッキーが見つからなかった場合
  return null;
}

// クッキー設定
function setCookie(name, value) {
  // クッキーを設定
  var newCookie = name + "=" + value;
  document.cookie = newCookie;
}

// エラー時処理
function showError(errorMsg1, errorMsg2) {
  // コンソールに表示
  console.error(errorMsg1, errorMsg2);
  // 画面に表示
  alert(errorMsg1 + errorMsg2);
}

// cssを切り替える関数
function toggleDarkness(image) {
  image.classList.toggle("darkened");
}
