/*
Copyright (c) 2009 amano <amano@miku39.jp>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

var pname_whitelist = [
    "supercell","rlboro","NanahoshiP",
    "aquascape", "BIRUGE", "DixieFlatline", "fourier-drive",
    "instinctive", "kame", "Lue", "MAX_VEGETABLE", "nabe_nabe",
    "neve", "ShakeSphere", "Sweet-Revenge", "saihane", "samfree",
    "TACHE", "twinkle", "une", "uunnie", "wintermute", "yusuke",
    "164", "19's_Sound_Factory", "4124",
    "AEGIS", "AETA(イータ)", "AS", "AVTechNO", "Azell", "A某",
    "air-i", "alt", "analgesic_agents", "andromeca", "arata", "awk",
    "BiRD(s)",
    "baker", "bestgt", "boss", "bothneco",
    "CALFO", "CaptainMirai", "Chiquewa", "CleanTears",
    "cenozoic", "cmmz", "cocotuki", "cokesi",
    "DARS", "DATEKEN", "DECO*27", "Dengaku", "Dog tails",
    "djA.Q.", "doriko",
    "embryo4713", "en",
    "FakeFar", "Fei", "FrozenStrawberry", "FuMay",
    "fukuda yuichi", "function",
    "G-Fac.", "G@POPO", "GlassOnion", "GonGoss",
    "gamusyara", "geppei-taro", "gurupon",
    "Harmonia", "Heavenz", "Hi-G", "HironoLin",
    "hajime1213", "halyosy", "hapi⇒", "hapio", "harun", "haruna808", "hiroou",
    "ICEproject", "IGASIO", "IGASI○", "ISOP【-＿-】",
    "ika", "inokix", "iroha(sasaki)",
    "KEI", "Karimono", "Kossy", "KuKuDoDo",
    "kashiwagi氏", "kinzouP(仮)", "koma", "kotaro", "kou", "kous", "kuma", "kz",
    "Ｋ．Ｅ",
    "L*aura", "LIQ", "LOLI.COM", "LOVE&P",
    "MCI_Error", "Masuda_K", "MiXNES", "MineK", "Myu",
    "m@rk", "m_yus", "madamxx", "mahiro", "malo", "masquer", "meam", "microgroover", "mijinko3", "miksolodyne-ts", "mikuru396", "mintiack", "musashi-k",
    "Nen-Sho-K", "Neri_McMinn", "Nem", "No.D", "Noya", "Nutts",
    "na:ky", "nankyoku", "nawo", "neiyu", "nil", "nita", "nof", "nx5r",
    "OPA", "OSTER_project", "OperaGhost", "Otomania",
    "o.ken", "oOらいかOo", "otetsu",
    "PEG", "PENGUINS_PROJECT", "Phantasma", "PolyphonicBranch", "P∴Rhythmatiq",
    "pan", "papiyon", "psgmania",
    "RTfactory", "Re:nG", "Revin", "Rin（ぎん）", "Rock", "ROY",
    "river", "roki", "ryo",
    "SaMa", "SHIKI", "SHUN", "SURROUND_ATTACK_（だいすけ）", "Sat4", "Shibayan", "So/M", "Studio_IIG",
    "sequel", "sh_m", "shin", "shin", "snowy*", "suzy", "swa", "sxxsxxsxxsxx", "synthesized_flowers",
    "TKM", "TOOKATO", "Tatsh", "Tripshots", "TuKuRu", "TzTech",
    "takotakoagare交響楽団", "takuyabrian", "tatmos", "team-FSR", "temporu", "tomo", "toya",
    "UPNUSY", "Uriaroma",
    "ukey", "unluck", "usuki",
    "VIVO",
    "vanzz", "void",
    "WEB-MIX",
    "X-Plorez",
    "ＸＧｗｏｒｋｓ",
    "YAMADA-SUN", "YHK", "YYMIKUYY", "Yoshihi",
    "ypl", "yu", "yukiwo", "yutaka", "yuukiss",
    "Zekky",
    "[TEST]",
    "Φ串Φ", "∀studio", "●テラピコス",
    "あああ（p）", "あつぞうくん", "あん", "えこ。", "えどみはる", "おいも",
    "アドム","ウインディー","エミリー",
    "かとちゃ", "がおじゅ〜", "きらら", "くっじー", "このり", "ごんぱち", "こみかん",
    "カリスマブレイクに定評のあるうP主", "ギン", "クマン先生", "クリアP(YS)", "クリーム市長", "こげどんぼ", "こげどんぼ*",
    "ｺﾞﾑ",
    "さいたまにすと", "さいはね", "さかきょ", "さね", "しみずたく", "しゃど", "すこっぷ", "すたじおEKO＆GP1",
    "ジキル", "スタジオいるかのゆ",
    "たかふみ", "たけchan", "たすどろ", "だいすけ", "ちゃぁ", "チョコパ幻聴P（パティシエ）", "ちーむ炙りトロ丼", "つぁいて", "でっち", "とおくできこえるデンシオン", "とち-music_box", "どぶウサギ",
    "タイスケ", "タドスケ", "チョコパ幻聴P(パティシエ)", "チータン", "チームほしくず", "ティッシュ姫", "テンネン", "トマ豆腐", "トーン",
    "なおぽ", "にゃくろ", "ねこすけ",
    "ナツカゼP(Tastle)", "ナヅキ",
    "ぱきら", "ぱんつのうた制作師団", "ぱんつのうた製作委員会", "ひろゆき", "びんご", "ぼか主", "ぽぴー",
    "ハチ", "バトロセンタプロデューサ", "ホケフレ", "ボカロ互助会", "ボッチ",
    "まはい", "まゆたま", "みるく", "もじゃぶた", "もも毛",
    "マッコイ", "ミナグ", "ミルクティー", "メロネード(仮)",
    "ゆよゆっぺ",
    "れい・ぼーん", "れお",
    "レインロード",
    "わたしょ",
    "三月", "不確定名：producer（1）", "五芒星", "伴長", "光収容の倉庫", "八白",
    "卯月めい", "友場洋", "名鉄2000系", "喜兵衛", "堤逢叶", "小林オニキス", "山本ニュー",
    "山本似之", "指毛", "杏あめ", "杏あめ（匿名希望の東京都在住）", "村下孝蔵", "林檎",
    "桃茄子", "桜雪", "森井ケンシロウ", "歌和サクラ", "煎茶", "田中和夫", "絵師じゃないKEI",
    "肉骸骨", "裸時", "鈴掛ヨモギ", "関西芋ぱん伝", "静野", "魂太郎@regamer", "黒サムネ",
    "鼎沙耶", "龍徹", "夢の旧作", "凪庵", "芋屋", "稲敷常州", "犬尾", "中村イネ", "鬼魔",
    "黒珈琲", "黒魔", "芸竜作", "砂礫の都", "鈴木ろりー太", "青磁", "大納僧",
    "谷屋", "ダブクリア", "たま葱", "冬沙", "狐夢想屋", "細江慎治", "了＆ミっちゃん", "流歌",
    "戸倉夏樹"];

/* ホワイトリストのデータ自体はニコリクさんから拝借して一部変更.
 * ニコリクさんのホワイトリストチェックのやり方は遅いので、
 * ハッシュテーブル作成してダイレクトに判定できるように高速化.
 */
for(let i=0;i<pname_whitelist.length;i++){
    pname_whitelist["_"+ ZenToHan(pname_whitelist[i])] = true;
}
