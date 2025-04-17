// JSONデータを取得する関数
function getJsonData(jsonUrl) {
  return new Promise((resolve, reject) => {
    $.getJSON(jsonUrl, function (data) {
      resolve(data);
    }).fail(function () {
      reject('Failed to load JSON file');
    });
  });
}

// CSVデータを取得する関数
async function fetchCsvData(fileName, skipRowCount = 0) {
  try {
    const response = await fetch(fileName);
    const text = await response.text();
    return parseCsv(text, skipRowCount);
  } catch (error) {
    throw new Error('Failed to load CSV file:' + fileName);
  }
}

// CSVデータをパースする関数（csvデータ内の「,」は「，」にしているため「,」に変換して返却）
function parseCsv(csvText, skipRowCount) {
  var regx = new RegExp(appsettings.commaInString, 'g');
  return csvText
    .trim()
    .split(/\r?\n|\r/)
    .slice(skipRowCount)
    .map((line) => line.split(',').map((value) => value.replace(regx, ',')));
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

// データをローカルストレージからクリアする関数
function removeLocal(key) {
  localStorage.removeItem(key);
}

// データをローカルストレージにセットする関数
function setLocal(key, value) {
  localStorage.setItem(key, value);
}

// ローカルストレージからデータをゲットする関数
function getLocal(key) {
  return localStorage.getItem(key);
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
  alert(errorMsg2);
}

// アルバムタップ時
function clickAlbum(image) {
  // 暗め表示の切り替え
  image.classList.toggle('darkened');
  // 選択中リストの編集
  if (image.name === 'album') {
    selectedAlbums = image.classList.contains('darkened')
      ? selectedAlbums.filter((item) => item !== image.id)
      : selectedAlbums.concat(image.id);
  }
  if (image.name === 'minialbum') {
    selectedMinialbums = image.classList.contains('darkened')
      ? selectedMinialbums.filter((item) => item !== image.id)
      : selectedMinialbums.concat(image.id);
  }

  // ローカルストレージに保存
  setLocalArray('selectedAlbums', selectedAlbums);
  setLocalArray('selectedMinialbums', selectedMinialbums);

  // アルバム、ミニアルバムリストより出題する曲リスト取得
  selectedSongIndex = getSelectedSongIndex();
  $('#songCount').text(selectedSongIndex.length + ' Songs');
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

// カラーチェンジ
function changeColor(plusCount) {
  // 今のカラーインデックスを取得し、次のインデックス設定（ない場合最新のもの）
  var colorIndex =
    Number(getLocal('colorIndex') ?? colorSets.length - 1) + plusCount;

  // 設定するカラーを設定（ない場合最初に戻る）
  var colorSet = colorSets[colorIndex] ?? colorSets[0];
  $('body').css({
    background: colorSet[1],
    color: colorSet[2],
  });
  $('.btn--main').css({
    'background-color': colorSet[3],
    color: colorSet[4],
  });

  // ★ ラジオボタン選択スタイルの更新
  // すべてのラベルのスタイルを一度リセット（←これ大事）
  $('.quizModeRadio').removeAttr('style');
  // チェックされたラジオのID取得
  const checkedId = $('input[name="quizMode"]:checked').attr('id');
  // チェックされたラジオに対応するラベルだけにスタイル適用
  $('label[for="' + checkedId + '"]').css({
    'background-color': colorSet[3],
    color: colorSet[4],
  });

  // ★ ラジオボタン選択スタイルの仕込み(選択中のカラーになるよう関数再設定)
  $('input[name="quizMode"]').on('change', function () {
    // ラベルをリセット
    $('.quizModeRadio').removeAttr('style');
    // チェックされたラジオのID取得
    const checkedId = $('input[name="quizMode"]:checked').attr('id');
    // 対応するラベルにスタイル付与
    $('label[for="' + checkedId + '"]').css({
      'background-color': colorSet[3],
      color: colorSet[4],
    });

    // ローカルストレージにセット
    setLocal('gameMode', $('input[name="quizMode"]:checked').val());
  });

  // 今のカラー設定をローカルストレージに保存
  var colorIndexNow = colorSets[colorIndex] ? colorIndex : 0;
  setLocal('colorIndex', colorIndexNow);
  // 今のカラー表示
  $('#changeColor').html(
    'Color ↺ <br>(' + (colorIndexNow + 1) + '/' + colorSets.length + ')'
  );
}
