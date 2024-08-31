/**
 * 【定数設定】
 */
// 画面表示モード
const display = {
  TOP: 1,
  QUIZ: 2,
  RESULT: 3,
};
// 設定ファイル情報
var appsettings = [];
// 歌詞ファイル情報
var csvData = [];
// ひとこと
var acaneWords = [];
// カラーセット
var colorSets = [];
// アルバム名リスト
var songAlbums = [];
var selectedAlbums = [];
var albums = [];
// ミニアルバム名リスト
var songMinialbums = [];
var selectedMinialbums = [];
var minialbums = [];
// 選択曲インデックス
var selectedSongIndex = [];
// クイズ
var quizzes = [];
// 現在のクイズインデックス
var currentQuizIndex;
// クイズ結果
var selectedList = [];

/**
 * 【イベント処理】
 */
// 1. 画面表示
$(document).ready(async function () {
  try {
    // 1. 設定ファイル読み込み
    appsettings = await getJsonData('appsettings.json');

    // 2. 歌詞情報読み込み
    csvData = await fetchCsvData(appsettings.lyricsFileName);
    songAlbums = csvData[appsettings.albumLine];
    albums = [...new Set(songAlbums)].filter((item) => item !== '-');
    songMinialbums = csvData[appsettings.minialbumLine];
    minialbums = [...new Set(songMinialbums)].filter((item) => item !== '-');

    // 3. ACAねさんのひとこと読み込み
    acaneWords = await fetchCsvData(appsettings.acaneWordsFileName);

    // 4. カラーセット読み込み
    colorSets = await fetchCsvData(appsettings.colorSetsFileName, 1);

    // 5. 開始画面を表示
    createDisplay(display.TOP);
  } catch (error) {
    // エラーハンドリング
    showError('Failed to load data:', error);
  }
});

// 2. クイズ読込
function loadQuiz(isInit = false) {
  try {
    // 再開の場合
    if (isInit) {
      // 現在の問題初期化
      currentQuizIndex = 0;
      // 結果初期化
      selectedList = [];
      // クイズ作成
      quizzes = createQuizzes();
    }

    // クイズ画面を表示
    createDisplay(display.QUIZ);
  } catch (error) {
    // エラーハンドリング
    showError('Failed to load quiz:', error);
  }
}

// 3. 選択肢タップ
function onSelect(selected) {
  try {
    // クイズ取得
    var quiz = quizzes[currentQuizIndex];

    // 結果保持
    selectedList.push(selected);

    // ラジオボタン制御
    $('[name="choices"]').each(function () {
      // 非活性
      $(this).prop('disabled', true);
      // 色変え
      var value = $(this).val();
      if (value == quiz.correctAnswer) {
        // 正解の択
        $(this).parent().addClass('label-correct');
        $('#marubatu' + value).append('〇');
      } else if (value == selected) {
        // 不正解の択(選んだ時だけ)
        $(this).parent().addClass('label-incorrect');
        $('#marubatu' + value).append('✕');
      }
    });

    // 最終問題ではない場合次の問題へ
    if (quizzes[currentQuizIndex + 1]) {
      currentQuizIndex++;
    }
    // NEXTボタン、RESULTボタン、MV表示
    $('#next').removeClass('visibility-hidden');
    $('#result').removeClass('visibility-hidden');
    $('#mv').removeClass('visibility-hidden');
  } catch (error) {
    // エラーハンドリング
    showError('Failed to show select:', error);
  }
}

// 4. Result画面表示
function showResult() {
  try {
    // クイズ画面を表示
    createDisplay(display.RESULT);
  } catch (error) {
    // エラーハンドリング
    showError('Failed to result select:', error);
  }
}

/**
 * 【Sub関数】
 */
// クイズ作成
function createQuizzes() {
  // 選択アルバムの曲名取得
  const songs = csvData[appsettings.songNameLine].filter((_, index) =>
    selectedSongIndex.includes(index)
  );
  // 選択アルバムの歌詞取得
  var lyrics = [];
  csvData.slice(appsettings.lyricsStartLine).forEach((lyric) => {
    lyrics.push(lyric.filter((_, index) => selectedSongIndex.includes(index)));
  });
  // 曲の動画ID取得
  const mvIds = csvData[appsettings.mvIdLine].filter((_, index) =>
    selectedSongIndex.includes(index)
  );
  // 問題数取得
  const quizzesLength = songs.length;
  // 選択肢数取得
  const choiceLength = appsettings.choiceLength;

  // 正常に処理できるかチェック
  if (!appsettings.allowSameSong && songs.length < quizzesLength) {
    throw new Error(
      '全曲数' +
        songs.length +
        '曲です。問題の重複を認めない設定で' +
        quizzesLength +
        '曲の問題は作れません。'
    );
  }
  if (songs.length < choiceLength) {
    throw new Error(choiceLength + '曲以上選んでね');
  }

  // 各変数初期化
  // 問題歌詞リスト
  let questions = [];
  // 正解曲リスト
  let songList = [];
  // 選択肢リスト(2次元配列)
  let choices = [[]];
  // 正解選択肢リスト
  let correctAnswers = [];
  // MVIDリスト
  let mvIdList = [];

  // 問題数分処理する
  for (let i = 0; i < quizzesLength; i++) {
    // 1. 正解曲決定
    let songIndex = '';
    let song = '';
    while (true) {
      // 乱数生成し、正解の曲を設定
      songIndex = getRamdomNumber(songs.length);

      // 曲取得
      song = songs[songIndex];

      // 曲名が取得でき被っていない場合正解曲決定
      if (song !== '' && !songList.includes(song)) {
        // 正解の曲リストに曲追加
        songList.push(song);
        // mvID追加
        mvIdList.push(mvIds[songIndex]);
        break;
      }
    }

    // 2. 選択肢曲作成
    // まず正解の曲格納
    choices[i] = [];
    choices[i][0] = song;

    // 残りの選択肢を作成
    for (let j = 1; j < choiceLength; j++) {
      // 不正解曲設定
      while (true) {
        // 乱数生成し、曲を設定
        const wrongSongIndex = getRamdomNumber(songs.length);

        // 不正解曲取得
        const wrongSong = songs[wrongSongIndex];

        // 曲名が取得でき被っていない場合選択肢決定
        if (wrongSong !== '' && !choices[i].includes(wrongSong)) {
          // 選択肢に設定
          choices[i][j] = wrongSong;
          break;
        }
      }
    }

    // 選択肢シャッフル
    choices[i] = shuffle(choices[i]);

    // 正解選択肢リストに格納
    correctAnswers.push(choices[i].indexOf(song));

    // 3. 問題文歌詞作成
    while (true) {
      // 乱数生成し、問題文の歌詞を設定
      const lyricsIndex = getRamdomNumber(lyrics.length);

      // 歌詞取得
      const lyric = lyrics[lyricsIndex][songIndex];

      // 問題文が取得でき、被っていない場合歌詞決定
      if (
        lyric !== '' &&
        (appsettings.allowSameSong || !questions.includes(lyric))
      ) {
        questions.push(lyric);
        break;
      }
    }
  }

  // 戻り値作成
  return questions.map((question, index) => ({
    question: question,
    correctAnswer: correctAnswers[index],
    choices: choices[index],
    mvId: mvIdList[index],
  }));
}

// 画面タグ作成
function createDisplay(mode) {
  // タグクリア
  $('#display').empty();

  // 変数初期化
  var tag = '';

  // タグ作成
  if (mode === display.TOP) {
    // 選択中アルバム設定
    selectedAlbums = getLocalArray('selectedAlbums');
    selectedMinialbums = getLocalArray('selectedMinialbums');
    // アルバム、ミニアルバムリストより出題する曲リスト取得
    selectedSongIndex = getSelectedSongIndex();

    tag += ' <h2 class="h2-display">Albums</h2>';
    albums.forEach(function (album, index) {
      tag +=
        ' <img src="' +
        appsettings.albumImagePath +
        +(index + 1) +
        '_' +
        album +
        '.jpg" id="' +
        album +
        '" name="album" alt="' +
        album +
        '" class="album' +
        (selectedAlbums.includes(album) ? '' : ' darkened') +
        '" onclick="clickAlbum(this)">';
    });

    tag += ' <h2 class="h2-display">Minialbums</h2>';
    minialbums.forEach(function (album, index) {
      tag +=
        ' <img src="' +
        appsettings.minialbumImagePath +
        (index + 1) +
        '_' +
        album +
        '.jpg" id="' +
        album +
        '" name="minialbum" alt="' +
        album +
        '" class="album' +
        (selectedMinialbums.includes(album) ? '' : ' darkened') +
        '" onclick="clickAlbum(this)">';
    });
    tag +=
      ' <h2 class="center-text margin-top-20" id="songCount">' +
      selectedSongIndex.length +
      ' Songs</h2>';
    tag += '<button id="start"';
    tag += '  onclick="loadQuiz(true)"';
    tag += '  class="btn btn--main btn--radius btn--cubic bottom-button"';
    tag += '>';
    tag += '  START';
    tag += '</button>';
    tag +=
      ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';

    // 紙吹雪解除
    $('canvas')?.remove();
  } else if (mode === display.QUIZ) {
    // QUIZ画面の場合
    var quiz = quizzes[currentQuizIndex];
    tag += ' ';
    tag += ' <!-- 問題番号 -->';
    tag +=
      ' <h2 class="h2-display">Question. ' +
      (currentQuizIndex + 1) +
      ' / ' +
      quizzes.length +
      '</h2>';
    tag += ' ';
    tag += ' <!-- 問題文 -->';
    tag += ' <p class="font-one-point-five">『' + quiz.question + '』</p>';
    tag += ' ';
    tag += ' <!-- 選択肢のラジオボタン + ラベル -->';
    quiz.choices.forEach((choice, index) => {
      tag += '   <label';
      tag += '     class="choice-radio-label"';
      tag += '   >';
      tag += '     <input';
      tag += '       type="radio"';
      tag += '       id="choice' + index + '"';
      tag += '       value="' + index + '"';
      tag += '       name="choices"';
      tag += '       onchange="onSelect(' + index + ')"';
      tag += '     >';
      tag += '     <span class="left-text">';
      tag += '     ' + choice;
      tag += '     </span>';
      tag +=
        '     <span id="marubatu' +
        index +
        '" class="right-text bold-text font-one-point-five">';
      tag += '     ';
      tag += '     </span>';
      tag += '   </label>';
      tag += ' ';
    });

    tag += ' ';
    tag += ' <!-- 次へ / 終了 ボタン -->';
    tag += quizzes[currentQuizIndex + 1]
      ? '   <button id="next" onclick="loadQuiz()" class="btn btn--main btn--radius btn--cubic visibility-hidden">NEXT→</button>'
      : '   <button id="result" onclick="showResult()" class="btn btn--main btn--radius btn--cubic visibility-hidden">RESULT</button>';
    // MV表示
    tag += '    <!--MV Youtube--> ';
    tag += '    <div class="margin-top-20 visibility-hidden" id="mv"> ';
    tag +=
      '      <div style="position: relative; width: 100%; padding-bottom: 56.25%"> ';
    tag += '        <div ';
    tag += '          style=" ';
    tag += '            position: absolute; ';
    tag += '            top: 0px; ';
    tag += '            left: 0px; ';
    tag += '            width: 100%; ';
    tag += '            height: 100%; ';
    tag += '          " ';
    tag += '        > ';
    tag += '          <iframe ';
    tag +=
      '            src="https://www.youtube.com/embed/' +
      quiz.mvId +
      '?loop=1&playlist=' +
      quiz.mvId +
      '" ';
    tag += '            frameborder="0" ';
    tag += '            width="100%" ';
    tag += '            height="100%" ';
    tag +=
      '            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ';
    tag += '            allowfullscreen="" ';
    tag += '            data-gtm-yt-inspected-32118529_704="true" ';
    tag += '          ></iframe> ';
    tag += '        </div> ';
    tag += '      </div> ';
    tag += '    </div> ';
  } else if (mode === display.RESULT) {
    // 問題数取得
    var quizzesLength = quizzes.length;
    // 正解数取得
    var correctCount = selectedList.filter(
      (value, index) => value === quizzes[index].correctAnswer
    ).length;
    // RESULT画面
    // 正解数表示
    tag +=
      ' <h2 class="center-text' +
      (correctCount === quizzesLength ? ' text-correct' : '') +
      '">' +
      correctCount +
      ' / ' +
      quizzesLength +
      '</h2>';
    tag +=
      correctCount === quizzesLength
        ? '<h2 class="center-text text-correct">PERFECT!!</h2>'
        : '';
    // Result表示
    tag += ' <h2 class="h2-display">Result</h2>';
    quizzes.forEach((quiz, index) => {
      tag +=
        ' <div class="font-one-point-two">Q' +
        (index + 1) +
        '. ' +
        quiz.question +
        '</div>';
      tag +=
        ' <div class="font-one-point-two right-text ' +
        (selectedList[index] === quiz.correctAnswer ? 'text-correct' : '') +
        '">' +
        quiz.choices[quiz.correctAnswer] +
        '</div>';
      tag += index === quizzes.length - 1 ? '' : '<br>';
    });
    // アルバム表示
    tag +=
      selectedAlbums.length > 0 ? ' <h2 class="h2-display">Albums</h2>' : '';
    albums.forEach(function (album, index) {
      if (selectedAlbums.includes(album)) {
        tag +=
          ' <img src="' +
          appsettings.albumImagePath +
          +(index + 1) +
          '_' +
          album +
          '.jpg" id="' +
          album +
          '" name="album" alt="' +
          album +
          '" class="album">';
      }
    });

    tag +=
      selectedMinialbums.length > 0
        ? '<h2 class="h2-display">Minialbums</h2>'
        : '';
    minialbums.forEach(function (album, index) {
      if (selectedMinialbums.includes(album)) {
        tag +=
          ' <img src="' +
          appsettings.minialbumImagePath +
          (index + 1) +
          '_' +
          album +
          '.jpg" id="' +
          album +
          '" name="minialbum" alt="' +
          album +
          '" class="album">';
      }
    });

    // 全問正解の場合紙吹雪、ひとこと
    if (correctCount === quizzesLength) {
      tag += '<h2 class="h2-display font-one-point-two">ひとこと</h2>';
      tag +=
        '<div class="font-one-point-two">' +
        acaneWords[0][getRamdomNumber(acaneWords[0].length)] +
        '</div>';
      $('#confetti').prepend('<canvas></canvas>');
      dispConfetti();
    }
    tag +=
      ' <button id="retry" onclick="createDisplay(display.TOP)" class="btn btn--main btn--radius btn--cubic">RETRY</button>';
  }

  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);
}
