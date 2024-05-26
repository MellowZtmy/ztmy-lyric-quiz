/**
 * 【定数設定】
 */
// 設定ファイル情報
var appsettings;
// 歌詞ファイル情報
var csvData;
// 画面表示モード
const display = {
  TOP: 1,
  QUIZ: 2,
  RESULT: 3,
};
// クイズ
var quizzes;
// 現在のクイズインデックス
var currentQuizIndex;
// クイズ結果
var resultList;

/**
 * 【イベント処理】
 */
// 1. 画面表示
$(document).ready(async function () {
  try {
    // 1. 設定ファイル読み込み
    appsettings = await getJsonData("appsettings.json");

    // 2. 歌詞情報読み込み
    csvData = await fetchCsvData();

    // 3. 開始画面を表示
    createDisplay(display.TOP);
  } catch (error) {
    // エラーハンドリング
    showError("Failed to load data:", error);
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
      resultList = [];
      // クイズ作成
      quizzes = createQuizzes();
    }

    // クイズ画面を表示
    createDisplay(display.QUIZ);
  } catch (error) {
    // エラーハンドリング
    showError("Failed to load quiz:", error);
  }
}

// 3. 選択肢タップ
function onSelect(selected) {
  try {
    // 結果取得
    var quiz = quizzes[currentQuizIndex];
    var isCorrect = quiz.correctAnswer == selected;

    // 結果保持
    resultList.push(isCorrect);

    // ラジオボタン制御
    $('[name="choices"]').each(function () {
      // 非活性
      $(this).prop("disabled", true);
      // 色変え
      var value = $(this).val();
      if (value == quiz.correctAnswer) {
        // 正解の択
        $(this).parent().addClass("label-correct");
      } else if (value == selected) {
        // 不正解の択(選んだ時だけ)
        $(this).parent().addClass("label-incorrect");
      }
    });

    // 結果を表示
    $(isCorrect ? "#correct" : "#incorrect").show();

    // 最終問題かどうか
    if (quizzes[currentQuizIndex + 1]) {
      // 次がある場合、NEXTボタン表示
      $("#next").show();
      // 今何問目かを加算
      currentQuizIndex++;
    } else {
      // 最終問題の場合、RESULTボタン表示
      $("#result").show();
    }
  } catch (error) {
    // エラーハンドリング
    showError("Failed to show select:", error);
  }
}

// 4. Result画面表示
function showResult() {
  try {
    // クイズ画面を表示
    createDisplay(display.RESULT);
  } catch (error) {
    // エラーハンドリング
    showError("Failed to result select:", error);
  }
}

/**
 * 【Sub関数】
 */
// クイズ作成
function createQuizzes() {
  // 全曲名取得
  const songs = csvData[appsettings.songNameLine];
  // 全歌詞取得
  const lyrics = csvData.slice(appsettings.lyricsStartLine);
  // 問題数取得
  const quizzesLength = 5;
  // 選択肢数取得
  const choiceLength = appsettings.choiceLength;

  // 正常に処理できるかチェック
  if (!appsettings.allowSameSong && songs.length < quizzesLength) {
    throw new Error(
      "全曲数" +
        songs.length +
        "曲です。問題の重複を認めない設定で" +
        quizzesLength +
        "曲の問題は作れません。"
    );
  }
  if (songs.length < choiceLength) {
    throw new Error(
      "全曲数" +
        songs.length +
        "曲です。" +
        choiceLength +
        "の選択肢は作れません。"
    );
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

  // 問題数分処理する
  for (let i = 0; i < quizzesLength; i++) {
    // 1. 正解曲決定
    let songIndex = "";
    let song = "";
    while (true) {
      // 乱数生成し、正解の曲を設定
      songIndex = Math.floor(Math.random() * songs.length);

      // 曲取得
      song = songs[songIndex];

      // 曲名が取得でき被っていない場合正解曲決定
      if (song !== "" && !songList.includes(song)) {
        // 正解の曲リストに曲追加
        songList.push(song);
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
        const wrongSongIndex = Math.floor(Math.random() * songs.length);

        // 不正解曲取得
        const wrongSong = songs[wrongSongIndex];

        // 曲名が取得でき被っていない場合選択肢決定
        if (wrongSong !== "" && !choices[i].includes(wrongSong)) {
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
      const lyricsIndex = Math.floor(Math.random() * lyrics.length);

      // 歌詞取得
      const lyric = lyrics[lyricsIndex][songIndex];

      // 問題文が取得でき、被っていない場合歌詞決定
      if (
        lyric !== "" &&
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
  }));
}

// 画面タグ作成
function createDisplay(mode) {
  // タグクリア
  $("#display").empty();

  // 変数初期化
  var tag = "";

  // タグ作成
  if (mode === display.TOP) {
    // TOP画面の場合
    tag += "<button";
    tag += '  onclick="loadQuiz(true)"';
    tag += '  class="btn btn--purple btn--radius btn--cubic bottom-button"';
    tag += ">";
    tag += "  START";
    tag += "</button>";

    // バージョン表示
    $("#version").append(appsettings.version);
  } else if (mode === display.QUIZ) {
    // QUIZ画面の場合
    var quiz = quizzes[currentQuizIndex];
    tag += " ";
    tag += " <!-- 問題番号 -->";
    tag += " <h2>Question. " + (currentQuizIndex + 1) + "</h2>";
    tag += " ";
    tag += " <!-- 問題文 -->";
    tag += ' <p style="font-size: 1.5em;">『' + quiz.question + "』</p>";
    tag += " ";
    tag += " <!-- 選択肢のラジオボタン + ラベル -->";
    quiz.choices.forEach((choice, index) => {
      tag += "   <label";
      tag += '     class="radio-label"';
      tag += '     style="display: block; font-size: 1.2em;"';
      tag += "   >";
      tag += "     <input";
      tag += '       type="radio"';
      tag += '       id="choice' + index + '"';
      tag += '       value="' + index + '"';
      tag += '       name="choices"';
      tag += '       onchange="onSelect(' + index + ')"';
      tag += "     >";
      tag += "     " + choice + "";
      tag += "   </label>";
      tag += " ";
    });

    tag += " <!-- 正解 or 不正解の表示 -->";
    tag +=
      ' <div id="correct" style="color: green; font-size: 2.0em;" class="center-text" hidden>GREAT！！</div>';
    tag +=
      ' <div id="incorrect" style="color: red; font-size: 2.0em;" class="center-text" hidden>MISS！</div>';
    tag += " ";
    tag += " <!-- 次へ / 終了 ボタン -->";
    tag +=
      '   <button id="next" onclick="loadQuiz()" class="btn btn--purple btn--radius btn--cubic" style="display: none;">NEXT→</button>';
    tag +=
      '   <button id="result" onclick="showResult()" class="btn btn--purple btn--radius btn--cubic" style="display: none;">RESULT</button>';
  } else if (mode === display.RESULT) {
    // RESULT画面
    tag +=
      ' <h2 class="center-text">' +
      resultList.filter((element) => element).length +
      " / " +
      resultList.length +
      "</h2>";
    tag += " ";
    tag += " ";
    tag +=
      ' <button id="retry" onclick="loadQuiz(true)" class="btn btn--purple btn--radius btn--cubic">RETRY</button>';
  }

  // タグ流し込み
  $("#display").append(tag);
}
