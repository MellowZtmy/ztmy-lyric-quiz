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

// ローカルストレージから配列を取得(nullは空に)
function getLocalArray(name) {
  return JSON.parse(localStorage.getItem(name)) ?? [];
}

// ローカルストレージに配列設定(nullは空に)
function setLocalArray(name, array) {
  localStorage.setItem(name, JSON.stringify(array ?? []));
}

// エラー時処理
function showError(errorMsg1, errorMsg2) {
  // コンソールに表示
  console.error(errorMsg1, errorMsg2);
  // 画面に表示
  alert(errorMsg1 + errorMsg2);
}

// アルバムタップ時
function clickAlbum(image) {
  // 暗め表示の切り替え
  image.classList.toggle("darkened");
  // 選択中リストの編集
  if (image.name === "album") {
    selectedAlbums = image.classList.contains("darkened")
      ? selectedAlbums.filter((item) => item !== image.id)
      : selectedAlbums.concat(image.id);
  }
  if (image.name === "minialbum") {
    selectedMinialbums = image.classList.contains("darkened")
      ? selectedMinialbums.filter((item) => item !== image.id)
      : selectedMinialbums.concat(image.id);
  }

  // ローカルストレージに保存
  setLocalArray("selectedAlbums", selectedAlbums);
  setLocalArray("selectedMinialbums", selectedMinialbums);

  // アルバム、ミニアルバムリストより出題する曲リスト取得
  selectedSongIndex = getSelectedSongIndex();
  $("#songCount").text(selectedSongIndex.length + " Songs");
}

// 配列同士で一致するもののインデックスを返す
function getMatchingIndices(arr1, arr2) {
  return arr1
    .map((item, index) => (arr2.includes(item) ? index : -1))
    .filter((index) => index !== -1);
}

// 出題する曲リスト
function getSelectedSongIndex() {
  return Array.from(
    new Set([
      ...getMatchingIndices(songAlbums, selectedAlbums),
      ...getMatchingIndices(songMinialbums, selectedMinialbums),
    ])
  );
}
