/**
 * 【定数設定】
 */
// 画面表示モード
const display = {
  TOP: 1,
  QUIZ: 2,
  RESULT: 3,
};
// ゲームモード
const gameMode = {
  LYRIC_TO_SONG: { VALUE: '1', TEXT: '歌詞から曲名' },
  SONG_TO_LYRIC: { VALUE: '2', TEXT: '曲名から歌詞' },
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
function loadQuiz(isInit) {
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
    $('#mv').show();
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
  // ゲームモード取得
  const currentGameMode = $('input[name="quizMode"]:checked').val();
  // 選択アルバムの曲名取得
  const songs = csvData[appsettings.songNameLine].filter((_, index) =>
    selectedSongIndex.includes(index)
  );
  // 選択アルバムの歌詞取得
  const lyrics = [];
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
    throw new Error('アルバムを1つ以上選んでね');
  }
  if (!currentGameMode) {
    throw new Error('モードを選んでね');
  }

  // 各変数初期化
  // 問題歌詞リスト
  let questions = [];
  // 正解リスト
  let answerList = []; // 正解（曲名 or 歌詞）
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
      if (song !== '' && !answerList.includes(song)) {
        // 正解の曲リストに曲追加
        answerList.push(song); // 歌詞モードでもベースは曲
        // mvID追加
        mvIdList.push(mvIds[songIndex]);
        break;
      }
    }

    // 選択肢作成
    choices[i] = [];
    if (currentGameMode === gameMode.LYRIC_TO_SONG.VALUE) {
      // 歌詞から曲を当てる（元のモード）
      choices[i][0] = song;

      for (let j = 1; j < choiceLength; j++) {
        while (true) {
          const wrongSongIndex = getRamdomNumber(songs.length);
          const wrongSong = songs[wrongSongIndex];
          if (wrongSong !== '' && !choices[i].includes(wrongSong)) {
            choices[i][j] = wrongSong;
            break;
          }
        }
      }

      choices[i] = shuffle(choices[i]);
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
          questions.push(lyric); // 問題文に歌詞を使う
          break;
        }
      }
    } else if (currentGameMode === gameMode.SONG_TO_LYRIC.VALUE) {
      // 曲から歌詞を当てる
      // 正解の歌詞
      let correctLyric = '';
      while (true) {
        const lyricsIndex = getRamdomNumber(lyrics.length);
        correctLyric = lyrics[lyricsIndex][songIndex];
        if (
          correctLyric !== '' &&
          (appsettings.allowSameSong || !choices.flat().includes(correctLyric))
        ) {
          break;
        }
      }

      choices[i][0] = correctLyric;

      let usedWrongSongIndexes = [songIndex]; // 正解曲インデックスを除外する

      for (let j = 1; j < choiceLength; j++) {
        while (true) {
          const wrongSongIndex = getRamdomNumber(songs.length);

          // 正解と同じ曲の歌詞はスキップ
          if (usedWrongSongIndexes.includes(wrongSongIndex)) continue;

          const lyricsIndex = getRamdomNumber(lyrics.length);
          const wrongLyric = lyrics[lyricsIndex][wrongSongIndex];

          if (wrongLyric !== '' && !choices[i].includes(wrongLyric)) {
            choices[i][j] = wrongLyric;
            usedWrongSongIndexes.push(wrongSongIndex);
            break;
          }
        }
      }

      choices[i] = shuffle(choices[i]);
      correctAnswers.push(choices[i].indexOf(correctLyric));
      questions.push(song); // 問題文には曲名を使う
    }
  }

  console.log(
    questions.map((question, index) => ({
      question: question,
      correctAnswer: correctAnswers[index],
      choices: choices[index],
      mvId: mvIdList[index],
    }))
  );
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
  // まずスピナーを表示
  if (mode === display.TOP) {
    $('#spinner').show(); // 画面がちらつくため、TOP以外の場合はスピナーは非表示にしておく
  }

  // 少し待ってから処理を開始（スピナー表示のため、DOM描画を反映させるため）
  setTimeout(() => {
    try {
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

        // ハイスコア表示
        tag +=
          ' <p class="right-text">High Score : ' +
          (getLocal('ztmyLyricQuizHighScore') ?? '-') +
          '</p>';

        // モード選択
        tag += ' <h2 class="h2-display">Mode</h2>';
        tag += ' <div class="quiz-mode-container">';
        for (const [modeKey, modeData] of Object.entries(gameMode)) {
          tag +=
            '   <input type="radio" id="' +
            modeKey +
            '" name="quizMode" value="' +
            modeData.VALUE +
            '" hidden ' +
            (getLocal('gameMode')
              ? modeData.VALUE === getLocal('gameMode') // ローカルストレージにゲームモードがある場合
                ? 'checked'
                : ''
              : modeData.VALUE === gameMode.LYRIC_TO_SONG.VALUE // ローカルストレージにゲームモードがない場合
              ? 'checked'
              : '') +
            '>';
          tag +=
            '   <label for="' +
            modeKey +
            '" class="quizModeRadio">' +
            modeData.TEXT +
            '</label>';
        }
        tag += ' </div>';
        // 今のゲームモードをローカルストレージにセット
        setLocal(
          'gameMode',
          getLocal('gameMode') ?? gameMode.LYRIC_TO_SONG.VALUE
        );

        // アルバム
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

        // ミニアルバム
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
        // STARTボタン
        tag += '<button id="start"';
        tag += '  onclick="loadQuiz(true)"';
        tag += '  class="btn btn--main btn--radius btn--cubic bottom-button"';
        tag += '>';
        tag += '  START';
        tag += '</button>';
        tag +=
          ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';
        tag += ' </div>';

        // 紙吹雪解除
        $('canvas')?.remove();

        // 一番上にスクロール
        window.scrollTo({
          top: 0,
        });
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
          ? '   <button id="next" onclick="loadQuiz(false)" class="btn btn--main btn--radius btn--cubic visibility-hidden">NEXT→</button>'
          : '   <button id="result" onclick="showResult()" class="btn btn--main btn--radius btn--cubic visibility-hidden">RESULT</button>';
        // MV表示
        tag += '    <!--MV Youtube--> ';
        tag += '    <div class="margin-top-20" id="mv" hidden> ';
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
        tag += '            height="100%"  style="border-radius: 15px;"';
        tag += '            allowfullscreen="" ';
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
          selectedAlbums.length > 0
            ? ' <h2 class="h2-display">Albums</h2>'
            : '';
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
            acaneWords[getRamdomNumber(acaneWords.length)] +
            '</div>';
          $('#confetti').prepend('<canvas></canvas>');
          dispConfetti();
        }
        tag +=
          ' <button id="retry" onclick="createDisplay(display.TOP)" class="btn btn--main btn--radius btn--cubic">RETRY</button>';

        // ハイスコア設定(「??」は「<」より優先度が低いのでカッコをつける
        if ((Number(getLocal('ztmyLyricQuizHighScore')) ?? 0) < correctCount) {
          setLocal('ztmyLyricQuizHighScore', correctCount);
        }
      }

      // タグ流し込み
      $('#display').append(tag);

      // CSS適用
      changeColor(0);
    } finally {
      // 最後にスピナーを非表示
      $('#spinner').hide();
    }
  }, 0); // 0ms で「次のイベントループ」で処理実行（レンダリング保証）
}
