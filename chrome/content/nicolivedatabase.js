/**
 * 動画データベースなど
 */

/* TABLE nicovideo
 * video_id       : character primary key 動画ID
 * title          : character 動画タイトル
 * description    : character 動画詳細
 * thumbnail_url  : character サムネイルURL
 * first_retrive  : integer 動画投稿日時
 * length         : integer 長さ
 * view_counter   : integer 再生数
 * comment_num    : integer コメント数
 * mylist_counter : integer マイリスト数
 * tags           : character タグ(カンマ区切りの文字列)
 * update_date    : integer DB情報の更新日時
 * pname          : character (0.7.2-) 動画固有P名
 * additional     : character (0.7.2-) 動画固有の追加情報
 * favorite       : integer (0.7.3-) お気に入り度
 */
/* TABLE requestcond
 * presetname : character primary key プリセット名
 * value      : character リクエスト条件(JSON)
 */
/* TABLE settings
 * key   : character キー
 * value : character 値(JSON)
 */

var NicoLiveDatabase = {
    numvideos: 0,
    addcounter: 0,
    updatecounter: 0,
    searchtarget: ["title","length","view_counter","comment_num","mylist_counter","tags","first_retrieve","video_id"],
    searchcond: ["include","exclude","gte","equal","lte"],

    addCurrentPlayedVideo:function(){
	// 現在再生中の曲をDBに登録.
	this.addVideos(NicoLiveHelper.musicinfo.video_id);
    },

    addVideos:function(sm){
	// sm/nm番号のテキストで渡す.
	if(sm.length<3) return;
	$('db-label').value="";
	$('input-db').value="";

	try{
	    let l;
	    l = sm.match(/mylist\/(\d+)$/);
	    if(l){
		NicoLiveMylist.addDatabase(l[1],"");
		return;
	    }
	    l = sm.match(/(sm|nm)\d+/g);
	    this.numvideos = l.length;
	    this.addcounter = 0;
	    this.updatecounter = 0;
	    for(let i=0,id;id=l[i];i++){
		this.addOneVideo(id);
	    }
	} catch (x) {
	}
    },

    addOneVideo:function(id){
	// 動画IDで渡す.
	if(id.length<3) return;

	let req = new XMLHttpRequest();
	if(!req) return;
	req.onreadystatechange = function(){
	    if( req.readyState==4 && req.status==200 ){
		let music = NicoLiveHelper.xmlToMovieInfo(req.responseXML);
		if( music ){
		    NicoLiveDatabase.addDatabase(music);
		}
	    }
	};
	let url = "http://www.nicovideo.jp/api/getthumbinfo/"+id;
	req.open('GET', url );
	req.send("");
    },

    addDatabase:function(music){
	// xmlToMovieInfoが作る構造でmusicを渡す.
	let st;

	// try insert
	//debugprint('try insert');
	st = this.dbconnect.createStatement('insert into nicovideo(video_id,title,description,thumbnail_url,first_retrieve,length,view_counter,comment_num,mylist_counter,tags,update_date) values(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)');
	st.bindUTF8StringParameter(0,music.video_id);
	st.bindUTF8StringParameter(1,music.title);
	st.bindUTF8StringParameter(2,music.description);
	st.bindUTF8StringParameter(3,music.thumbnail_url);
	st.bindInt32Parameter(4,music.first_retrieve);
	st.bindInt32Parameter(5,music.length_ms/1000);
	st.bindInt32Parameter(6,music.view_counter);
	st.bindInt32Parameter(7,music.comment_num);
	st.bindInt32Parameter(8,music.mylist_counter);
	st.bindUTF8StringParameter(9,music.tags.join(','));
	st.bindInt32Parameter(10,GetCurrentTime());

	let callback = {
	    handleCompletion:function(reason){
		if(!this.error){
		    NicoLiveDatabase.addcounter++;
		    $('db-label').value = "追加:"+NicoLiveDatabase.addcounter +"件/"
			+ "更新:"+NicoLiveDatabase.updatecounter + "件";
		}
	    },
	    handleError:function(error){
		// insertが失敗のときはすでに行があるのでupdateにする.
		debugprint('insert error/'+error.result+'/'+error.message);
		NicoLiveDatabase.updateRow(music);
		this.error = true;
	    },
	    handleResult:function(result){
	    }
	};
	st.executeAsync(callback);
    },

    updateRow:function(music){
	let st = this.dbconnect.createStatement('update nicovideo set title=?1,description=?2,thumbnail_url=?3,first_retrieve=?4,length=?5,view_counter=?6,comment_num=?7,mylist_counter=?8,tags=?9,update_date=?10 where video_id=?11');
	st.bindUTF8StringParameter(0,music.title);
	st.bindUTF8StringParameter(1,music.description);
	st.bindUTF8StringParameter(2,music.thumbnail_url);
	st.bindInt32Parameter(3,music.first_retrieve);
	st.bindInt32Parameter(4,music.length_ms/1000);
	st.bindInt32Parameter(5,music.view_counter);
	st.bindInt32Parameter(6,music.comment_num);
	st.bindInt32Parameter(7,music.mylist_counter);
	st.bindUTF8StringParameter(8,music.tags.join(','));
	st.bindInt32Parameter(9,GetCurrentTime());
	st.bindUTF8StringParameter(10,music.video_id);
	//debugprint('update '+music.video_id);
	let callback = {
	    handleCompletion:function(reason){
		NicoLiveDatabase.updatecounter++;
		$('db-label').value = "追加:"+NicoLiveDatabase.addcounter +"件/"
		    + "更新:"+NicoLiveDatabase.updatecounter + "件";
	    },
	    handleError:function(error){
		debugprint('update error'+error.result+'/'+error.message);
	    },
	    handleResult:function(result){
	    }
	};
	st.executeAsync(callback);
    },

    // 動画IDから検索.
    getVideoFromId:function(sm){
	let st = this.dbconnect.createStatement('SELECT * FROM nicovideo WHERE video_id = ?1');
	let music = {};
	st.bindUTF8StringParameter(0,id);
	while(st.step()){
	    music = rowToMusicInfo(st.row);
	}
	st.finalize();
	return music;
    },

    removeSearchLine:function(e){
	let hbox = $('search-condition').getElementsByTagName('hbox');
	if(hbox.length<=1) return;
	debugprint(e.target);
	$('search-condition').removeChild(e.target.parentNode);
    },

    addSearchLine:function(){
	let menulist;
	let elem;
	let hbox = CreateElement('hbox');
	elem = CreateElement('menupopup');
	elem.appendChild(CreateMenuItem("タイトル",0));
	elem.appendChild(CreateMenuItem("時間(秒)",1));
	elem.appendChild(CreateMenuItem("再生数",2));
	elem.appendChild(CreateMenuItem("コメント数",3));
	elem.appendChild(CreateMenuItem("マイリスト数",4));
	elem.appendChild(CreateMenuItem("タグ",5));
	elem.appendChild(CreateMenuItem("投稿日",6));
	elem.appendChild(CreateMenuItem("動画ID",7));
	menulist = CreateElement('menulist');
	menulist.appendChild(elem);
	hbox.appendChild(menulist);

	elem = CreateElement('menupopup');
	elem.appendChild(CreateMenuItem("含む",0));
	elem.appendChild(CreateMenuItem("含まない",1));
	elem.appendChild(CreateMenuItem("以上",2));
	elem.appendChild(CreateMenuItem("等しい",3));
	elem.appendChild(CreateMenuItem("以下",4));
	menulist = CreateElement('menulist');
	menulist.appendChild(elem);
	hbox.appendChild(menulist);

	elem = CreateElement('textbox');
	elem.setAttribute('flex','1');
	//elem.setAttribute('type','search');
	//elem.setAttribute('autocompletesearch','form-history');
	//elem.addEventListener('command',function(e){ NicoLiveDatabase.search(); }, false);
	hbox.appendChild(elem);

	//elem = CreateButton('+');
	//elem.addEventListener('command',function(e){ NicoLiveDatabase.addSearchLine();}, false);
	elem = CreateHTMLElement('input');
	elem.setAttribute('type','button');
	elem.setAttribute('value','+');
	elem.addEventListener('click',function(e){ NicoLiveDatabase.addSearchLine();}, false);
	hbox.appendChild(elem);

	//elem = CreateButton('-');
	//elem.addEventListener('command',function(e){ NicoLiveDatabase.removeSearchLine(e);}, false);
	elem = CreateHTMLElement('input');
	elem.setAttribute('type','button');
	elem.setAttribute('value','-');
	elem.addEventListener('click',function(e){ NicoLiveDatabase.removeSearchLine(e);}, false);
	hbox.appendChild(elem);
	$('search-condition').appendChild(hbox);
    },

    // 検索本体.
    search:function(){
	let hbox = $('search-condition').getElementsByTagName('hbox');
	let sql = "select *,1000*mylist_counter/view_counter as mylist_rate from nicovideo where ";
	let cnt;
	let cond = [];
	let i,item;
	// statementを作るフェーズ.
	for(i=0,cnt=0;item=hbox[i];i++){
	    let menulist = item.getElementsByTagName('menulist');
	    let textbox  = item.getElementsByTagName('textbox');
	    if(!textbox[0].value) continue;
	    // 検索項目.
	    let tmp;
	    tmp = this.searchtarget[parseInt(menulist[0].value)] +" ";

	    cnt++;
	    switch(this.searchcond[parseInt(menulist[1].value)]){
	    case "include": tmp += "like ?"+cnt; break;
	    case "exclude": tmp += "not like ?"+cnt; break;
	    case "gte":     tmp += ">=?"+cnt; break;
	    case "equal":   tmp += "=?"+cnt; break;
	    case "lte":     tmp += "<=?"+cnt; break;
	    default: debugprint("unknown condition"); continue;
	    }
	    cond[cnt-1] = tmp;
	}
	if(cnt<=0) return;

	sql += cond.join(' and '); // 条件は全部andで.
	sql += " order by " + $('db-search-orderby').value;
	sql += " " + $('db-search-order').value;
	sql += " limit 0," + parseInt($('db-search-max').value);
	debugprint('sql='+sql);

	let st = this.dbconnect.createStatement(sql);
	// bindするフェーズ.
	for(i=0,cnt=0;item=hbox[i];i++){
	    let menulist = item.getElementsByTagName('menulist');
	    let textbox  = item.getElementsByTagName('textbox');
	    if(!textbox[0].value) continue;

	    switch(this.searchcond[parseInt(menulist[1].value)]){
	    case "include":
	    case "exclude":
		st.bindUTF8StringParameter(cnt,"%"+textbox[0].value+"%");
		break;
	    case "gte":
	    case "equal":
	    case "lte":
		var tmp;
		if(this.searchtarget[parseInt(menulist[0].value)]=="first_retrieve"){
		    let date;
		    let d;
		    date = textbox[0].value.match(/\d+/g);
		    if(date.length==6){
			d = new Date(date[0],date[1]-1,date[2],date[3],date[4],date[5]);
			tmp = parseInt(d.getTime() / 1000); // integer
		    }else{
			d = new Date(date[0],date[1]-1,date[2],0,0,0);
			tmp = parseInt(d.getTime() / 1000); // integer
		    }
		}else{
		    tmp = parseInt(textbox[0].value);
		}
		st.bindInt64Parameter(cnt,tmp);
		break;
	    default: debugprint("unknown condition"); continue;
	    }
	    cnt++;
	}

	let callback = {
	    handleCompletion:function(reason){
		debugprint('search complete');
		$('db-label').value = NicoLiveDatabase._searchresult.length + '件ありました';
	    },
	    handleError:function(error){
		debugprint('search error/'+error.result+'/'+error.message);
	    },
	    handleResult:function(result){
		let row;
		while(row = result.getNextRow()){
		    let music=NicoLiveDatabase.rowToMusicInfo(row);
		    NicoLiveDatabase.addSearchResult(music);
		    NicoLiveDatabase._searchresult.push(music);
		}
	    }
	};
	this._searchresult = new Array();
	clearTable($('database-table'));
	st.executeAsync(callback);
    },

    // 検索結果を全部ストックに追加する.
    addStockAll:function(){
	let str = "";
	for(let i=0,item;item=this._searchresult[i];i++){
	    str += item.video_id + ",";
	}
	NicoLiveRequest.addStock(str);
    },

    // 選択した1つをストックに追加.
    addStockOne:function(){
	let elem = FindParentElement(document.popupNode,'vbox');
	NicoLiveRequest.addStock(elem.firstChild.textContent);
    },

    // 選択した1つをリクエスト送信.
    sendRequestOne:function(){
	let elem = FindParentElement(document.popupNode,'vbox');
	let video_id = elem.firstChild.textContent;
	if(NicoLiveHelper.iscaster){
	    NicoLiveRequest.addRequest(video_id);
	}else{
	    NicoLiveHelper.postListenerComment(video_id,"");
	}
    },

    // 検索結果テーブルに行を追加する.
    addSearchResult:function(item){
	let table = $('database-table');
	if(!table){ return; }

	let tr = table.insertRow(table.rows.length);
	tr.className = table.rows.length%2?"table_oddrow":"table_evenrow";

	let td;
	td = tr.insertCell(tr.cells.length);
	td.innerHTML = "#"+table.rows.length;

	let n = table.rows.length;

	td = tr.insertCell(tr.cells.length);
	let str;
	str = "<vbox context=\"popup-db-result\"><html:span style=\"display:none;\">"+item.video_id+"</html:span>"
	    + "<html:div>"
	    + "<label><html:a onclick=\"window.opener.getBrowser().addTab('http://www.nicovideo.jp/watch/"+item.video_id+"');\">"+item.video_id+"</html:a>/"+item.title+"</label><html:br/>";

	let datestr = GetDateString(item.first_retrieve*1000);
	str+= "<label value=\"投稿日:" + datestr +" "
	    + "再生数:"+item.view_counter+" コメント:"+item.comment_num
	    + " マイリスト:"+item.mylist_counter+" 時間:"+item.length+"\"/>"
	    + "</html:div>"
	    + "<label crop=\"end\" value=\"タグ:" + item.tags.join(",") + "\"/>"
	    + "</vbox>";
	td.innerHTML = str;
    },

    // 行からmusicinfoに変換.
    rowToMusicInfo:function(row){
	let info ={};
	info.video_id = row.getResultByName('video_id');
	info.title    = htmlspecialchars(row.getResultByName('title'));
	info.description = htmlspecialchars(row.getResultByName('description'));
	info.thumbnail_url  = row.getResultByName('thumbnail_url');
	info.first_retrieve = row.getResultByName('first_retrieve');
	info.length         = row.getResultByName('length');
	info.length_ms      = info.length*1000;
	info.length         = GetTimeString(info.length);
	info.view_counter   = row.getResultByName('view_counter');
	info.comment_num    = row.getResultByName('comment_num');
	info.mylist_counter = row.getResultByName('mylist_counter');
	let tags            = row.getResultByName('tags');
	info.tags           = tags.split(/,/);
	info.pname          = row.getResultByName('pname');
	return info;
    },

    setRegisterdVideoNumber:function(){
	let st = this.dbconnect.createStatement('SELECT count(video_id) FROM nicovideo');
	let n = 0;
	while(st.executeStep()){
	    n = st.getInt32(0);
	}
	st.finalize();
	$('db-label').value = n +"件登録済み";
    },

    // 現在のvbox内の動画IDをコピーする(リク、ストック、DBで共通利用可)
    copyToClipboard:function(){
	let elem = FindParentElement(document.popupNode,'vbox');
	CopyToClipboard(elem.firstChild.textContent); // 動画IDを取れる.
    },
    // 動画のページを開く
    openVideoPage:function(){
	let elem = FindParentElement(document.popupNode,'vbox');
	window.opener.getBrowser().addTab('http://www.nicovideo.jp/watch/'+elem.firstChild.textContent);
    },

    setPName:function(){
	let elem = FindParentElement(document.popupNode,'vbox');
	let video_id = elem.firstChild.textContent;
	if(video_id.length<=0) return;
	let oldpname = this.getPName(video_id);
	let pname = window.prompt("「"+video_id+"」のP名を入力してください",oldpname);
	if(pname!=null){
	    let st;
	    st = this.dbconnect.createStatement('update nicovideo set pname=?1 where video_id=?2');
	    st.bindUTF8StringParameter(0,pname);
	    st.bindUTF8StringParameter(1,video_id);
	    st.execute();
	    st.finalize();
	}
    },
    getPName:function(video_id){
	let st = this.dbconnect.createStatement('SELECT pname FROM nicovideo WHERE video_id = ?1');
	let pname;
	st.bindUTF8StringParameter(0,video_id);
	while(st.step()){
	    pname = st.getString(0);
	}
	st.finalize();
	if(!pname) pname = "";
	return pname;
    },

    setAdditional:function(){
	let elem = FindParentElement(document.popupNode,'vbox');
	let video_id = elem.firstChild.textContent;
	if(video_id.length<=0) return;
	let oldadditional = this.getAdditional(video_id);
	let additional = window.prompt("「"+video_id+"」の追加情報を入力してください",oldadditional);
	if(additional!=null){
	    let st;
	    st = this.dbconnect.createStatement('update nicovideo set additional=?1 where video_id=?2');
	    st.bindUTF8StringParameter(0,additional);
	    st.bindUTF8StringParameter(1,video_id);
	    st.execute();
	    st.finalize();
	}
    },
    getAdditional:function(video_id){
	let st = this.dbconnect.createStatement('SELECT additional FROM nicovideo WHERE video_id = ?1');
	let additional;
	st.bindUTF8StringParameter(0,video_id);
	while(st.step()){
	    additional = st.getString(0);
	}
	st.finalize();
	if(!additional) additional = "";
	return additional;
    },

    // 汎用ストレージにname,JavascriptオブジェクトをJSON形式で保存.
    saveGPStorage:function(name,obj){
	let st;
	let value = JSON.stringify(obj);
	//Application.console.log(value);
	try{
	    st = this.dbconnect.createStatement('insert into gpstorage(key,value) values(?1,?2)');
	    st.bindUTF8StringParameter(0,name);
	    st.bindUTF8StringParameter(1,value);
	    st.execute();
	    st.finalize();
	} catch (x) {
	    st = this.dbconnect.createStatement('update gpstorage set value=?1 where key=?2');
	    st.bindUTF8StringParameter(0,value);
	    st.bindUTF8StringParameter(1,name);
	    st.execute();
	    st.finalize();
	}
    },

    // 汎用ストレージからJSON形式のJavascriptオブジェクトを読み込む.
    loadGPStorage:function(name,defitem){
	let st = this.dbconnect.createStatement('SELECT value FROM gpstorage where key=?1');
	st.bindUTF8StringParameter(0,name);
	let value = "";
	while(st.step()){
	    value=st.getString(0);
	}
	st.finalize();
	let item;
	if(value){
	    item = JSON.parse(value);
	}else{
	    item = defitem;
	}
	return item;
    },

    // 動画情報を記録するDB
    createVideoDB:function(){
	if(!this.dbconnect.tableExists('nicovideo')){
	    // テーブルなければ作成.
	    this.dbconnect.createTable('nicovideo','video_id character primary key, title character, description character, thumbnail_url character, first_retrieve integer, length integer, view_counter integer, comment_num integer, mylist_counter integer, tags character, update_date integer, pname character, additional character, favorite integer');
	}else{
	    // 既に存在していればpname,additionalフィールドを追加する(0.7.2-).
	    try{
		let sql = "alter table nicovideo add pname character";
		this.dbconnect.executeSimpleSQL(sql);
	    } catch (x) {
		debugprint('pname column was already exist');
	    }
	    try{
		let sql = "alter table nicovideo add additional character";
		this.dbconnect.executeSimpleSQL(sql);
	    } catch (x) {
		debugprint('additional column was already exist');
	    }
	    // 0.7.3-
	    try{
		let sql = "alter table nicovideo add favorite integer";
		this.dbconnect.executeSimpleSQL(sql);
	    } catch (x) {
		debugprint('favorite column was already exist');
	    }
	}
    },

    // リク制限を保存するDB
    createRequestCondDB:function(){
	if(!this.dbconnect.tableExists('requestcond')){
	    this.dbconnect.createTable('requestcond','presetname character primary key, value character');
	}
    },

    // 汎用(General-Purpose)で使うDB
    createGPStorageDB:function(){
	if(!this.dbconnect.tableExists('gpstorage')){
	    this.dbconnect.createTable('gpstorage','key character primary key, value character');
	}
    },

    init:function(){
	debugprint('NicoLiveDatabase init');
	this.addSearchLine();

        let file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
        file.append("nicolivehelper_miku39jp.sqlite");

        let storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
        this.dbconnect = storageService.openDatabase(file);
	this.createVideoDB();
	this.createRequestCondDB();
	this.createGPStorageDB();
	this.setRegisterdVideoNumber();
    },
    destroy:function(){
	// This call will not be successful
	// unless you call finalize() on all of your remaining mozIStorageStatement  objects.
	//debugprint('db close');
	//this.dbconnect.close();
    }
};

window.addEventListener("load", function(e){ NicoLiveDatabase.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveDatabase.destroy(); }, false);
