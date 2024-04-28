
/**
 * 【定数設定】
 */
// 設定ファイル情報
var appsettings;
// 歌詞情報
var csvData;
const quizzesLength = 10;  // 問題数
const choiceLength  = 5;  // 選択肢数


/**
 * 【イベント処理】
 */
// 1. 画面表示
$(document).ready(async function(){
    try {
        // ①設定ファイル読み込み
        appsettings = await getJsonData('appsettings.json');

        // ②歌詞情報読み込み
        await fetchCsvData(appsettings.lyricsFileName);

        // ③クイズ作成
        var a = createQuizzes();
        console.log(a);
    } catch (error) {
        // エラーハンドリング
        console.error('Failed to load data:', error);
    }
});

/**
 * 【Sub関数】
 */
// JSONデータを取得する関数
function getJsonData(jsonUrl) {
    return new Promise((resolve, reject) => {
        $.getJSON(jsonUrl, function(data){
            resolve(data);
        }).fail(function(){
            reject('Failed to load JSON file');
        });
    });
}

// CSVデータを取得する関数
async function fetchCsvData(csvUrl) {
    try {
        const response = await fetch(csvUrl);
        const text = await response.text();
        csvData = parseCsv(text); // グローバル変数にCSVデータを格納
    } catch (error) {
        throw new Error('Failed to load CSV file');
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
        let value = '';

        for (let j = 0; j < line.length; j++) {
            const char = line.charAt(j);

            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                row.push(value);
                value = '';
            } else {
                value += char;
            }
        }

        row.push(value);
        data.push(row);
    }

    return data;
}

// クイズ作成
function createQuizzes(){
    // 全曲名取得
    const songs = csvData[appsettings.songNameLine];
    // 全歌詞取得
    const lyrics = csvData.splice(appsettings.lyricsStartLine);

    // 正常に処理できるかチェック
    if(!appsettings.allowSameSong && songs.length < quizzesLength){
        throw new Error('全曲数：' + songs.length + '曲です。問題の重複を認めない設定(appsettings.allowSameSong=' + appsettings.allowSameSong + ')で' +
                        quizzesLength + '曲の問題は作れません。');
    }
    if(songs.length < choiceLength){
        throw new Error('全曲数：' + songs.length + '曲です。' + choiceLength + 'の選択肢は作れません。');
    }

    // 各変数初期化
    // 問題歌詞リスト
    const quizzes = [];
    // 正解曲リスト
    const songList = [];
    // 選択肢リスト(2次元配列)
    const choices = [[]];
    // 正解選択肢リスト
    const correctAnswers = [];

    // 問題数分処理する
    for(let i = 0; i < quizzesLength; i++){
        // 1. 正解曲決定
        let songIndex = "";
        let song = "";
        while(true){
            // 乱数生成し、正解の曲を設定
            songIndex = Math.floor(Math.random() * songs.length);

            // 曲取得
            song = songs[songIndex];

            // 曲名が取得でき被っていない場合正解曲決定
            if(song !== "" && !songList.includes(song)) {
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
        for(let j = 1; j < choiceLength; j++){
            // 不正解曲設定
            while(true){
                // 乱数生成し、曲を設定
                const wrongSongIndex = Math.floor(Math.random() * songs.length);

                // 不正解曲取得
                const wrongSong = songs[wrongSongIndex];

                // 曲名が取得でき被っていない場合選択肢決定
                if(wrongSong !== "" && !choices[i].includes(wrongSong)) {
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
        while(true){
            // 乱数生成し、問題文の歌詞を設定
            const lyricsIndex = Math.floor(Math.random() * lyrics.length);

            // 歌詞取得
            const lyric = lyrics[lyricsIndex][songIndex];

            // 問題文が取得でき、被っていない場合歌詞決定
            if(lyric !== "" && (appsettings.allowSameSong || !quizzes.includes(lyric))) {
                quizzes.push(lyric);
                break;
            }
        }
    }

    // 戻り値作成
    return quizzes.map((quiz, index) => ({
        text: quiz,
        correctAnswer: correctAnswers[index],
        choises: choices[index]
    }));
}

// 配列をシャッフルして返す
function shuffle(array){
    var result = [];
    for(i = array.length; i > 0; i--){
      var index = Math.floor(Math.random() * i);
      var val = array.splice(index, 1)[0];
      result.push(val);
    }
    return result;
}
