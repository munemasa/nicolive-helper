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
Components.utils.import("resource://nicolivehelpermodules/sharedobject.jsm");

/**
 * コメントウィンドウ
 */
var NicoLiveComment = {
    commentlog: [],

    log_num: 500,

    prev_comment_no: 0,    // 直前のコメ番(NGコメント検出・表示のためのコメ番記録).
    current_comment_no: 0, // 現在のコメ番(単純増加のみで表示リフレッシュがあっても不変).

    getScrollBox:function(){
	if( this._comment_box ) return this._comment_box;
	this._comment_box = $('comment-box').boxObject.QueryInterface(Components.interfaces.nsIScrollBoxObject);
	return this._comment_box;
    },
    getPosition:function(){
	let y = {};
	this.getScrollBox().getPosition({},y);
	return y.value;
    },
    getScrolledSize:function(){
	let height = {};
	this.getScrollBox().getScrolledSize({}, height);
	return height.value;
    },

    onScroll:function(e){
	let box = this.getScrollBox();
	let y = {};
	let height = {};
	box.getPosition({},y);
	box.getScrolledSize({}, height);
	if( y.value==0 ){
	    debugprint("top");
	}else if( y.value+box.height >= height.value ){
	    debugprint("bottom");
	}else{
	    //debugprint("inner");
	}
    },

    /** コメント表示テーブルに一行追加したりコメントリフレクトしたり.
     */
    addRow:function(comment,disablereflection){
	let table = $('comment_table');
	if(!table){ return; }

	if( this.prev_comment_no!=0 && comment.no!=0 ){
	    while( NicoLivePreference.ngwordfiltering && this.prev_comment_no+1!=comment.no ){
		// コメ番がスキップしていたらそれはNGコメ.
		let tmp = NicoLiveComment.prev_comment_no+1;
		let com = {
		    no: tmp,
		    comment_no: tmp,
		    user_id: "--------",
		    text: "=== NGコメント ===",
		    date: 0,
		    premium: 0,
		    anonimity: 0,
		    mail: "",
		    name: "",
		    isNGWord: 1
		};
		this.addRow(com,disablereflection);

		// リスナーコメだけがNGワードフィルタの対象.
		if( this.current_comment_no <= com.no ){
		    if( NicoLiveHelper.iscaster && NicoLivePreference.ngword_recomment ){
			if( !NicoLiveHelper._timeshift && comment.date>=NicoLiveHelper.connecttime ){
			    let recomment = ">>"+com.no+" NGワードが含まれています";
			    //LoadFormattedString('STR_RECOMMENT_NGWORD',[comment.no, comment.text, ngword]);
			    NicoLiveHelper.postCasterComment(recomment,"");
			}
		    }
		}
	    }
	}
	this.prev_comment_no = comment.no;
	if(this.current_comment_no<comment.no) this.current_comment_no = comment.no;

	// 指定行数まで.
	if(table.rows.length>=NicoLivePreference.log_num){
	    table.deleteRow(table.rows.length-1);
	}

	//let tr = table.insertRow(table.rows.length);
	let tr = table.insertRow(0);

	if(!this.colormap[comment.user_id]){
	    let sel = GetRandomInt(1,8);
	    let col = 'color'+sel;
	    tr.className = col;
	    this.colormap[comment.user_id] = {"color":col, "date":GetCurrentTime()};
	}else{
	    let col = this.colormap[comment.user_id].color;
	    if( col.indexOf('color')==0 ){
		tr.className = col;
	    }else{
		tr.style.backgroundColor = col;
	    }
	}

	if(comment.premium >= 2){
	    tr.className = "table_casterselection";
	}else{
	    if( comment.isNGWord ){
		tr.className = "table_played";
	    }
	}

	let td;
	td = tr.insertCell(tr.cells.length);
	td.textContent = comment.no;

	td = tr.insertCell(tr.cells.length);

	let str;
	// nameが指定されていればその名前を使用する.
	str = comment.name || this.namemap[comment.user_id] && this.namemap[comment.user_id].name || comment.user_id;

	str = htmlspecialchars(str);
	td.innerHTML = "<hbox comment_by=\""+comment.user_id+"\" class=\"selection\" tooltiptext=\""+(comment.user_id)+"\" context=\"popup-comment\" user_id=\""+comment.user_id+"\" comment_no=\""+comment.no+"\">"+str+"</hbox>";

	td = tr.insertCell(tr.cells.length);
	if(comment.premium==3){
	    str = comment.text.replace(/<.*?>/g,""); // 主コメだけタグ除去.
	}else{
	    str = comment.text;
	}
	str = htmlspecialchars(str);
	    
	let tmp = str.split(/(sm\d+|nm\d+|\d{10}|&\w+;)/);
	let i;
	for(i=0;i<tmp.length;i++){
	    if( !tmp[i].match(/(sm\d+|nm\d+|\d{10}|&\w+;)/) ){
		tmp[i] = tmp[i].replace(/(.{35,}?)/g,"$1<html:wbr/>");
	    }
	}
	str = tmp.join("");
	str = str.replace(/(\r\n|\r|\n)/gm,"<html:br/>");

	// sm,nmにリンクを貼り付け.
	str = str.replace(/((sm|nm)\d+)/g,"<hbox class=\"selection\" context=\"popup-comment-anchor\"><html:a onmouseover=\"NicoLiveComment.showThumbnail(event,'$1');\" onmouseout=\"NicoLiveComment.hideThumbnail();\" onclick=\"NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/$1');\">$1</html:a></hbox>");
	if( comment.premium!=3 ){
	    // 数字10桁にもリンク.
	    if( !str.match(/(sm|nm)\d+/) ){
		str = str.replace(/(\d{10})/g,"<html:a onmouseover=\"NicoLiveComment.showThumbnail(event,'$1');\" onmouseout=\"NicoLiveComment.hideThumbnail();\" onclick=\"NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/$1');\">$1</html:a>");
	    }
	}
	try{
	    td.innerHTML = "<hbox flex=\"1\" class=\"selection\" context=\"popup-copycomment\">"+str+"</hbox>";
	} catch (x) {
	    debugprint(x);
	    debugprint(str);
	}

	td = tr.insertCell(tr.cells.length);
	td.textContent = GetDateString(comment.date*1000);

	if(comment.premium<2 && !disablereflection){
	    this.reflection(comment);
	}

	if( comment.date>=NicoLiveHelper.connecttime ){
	    let y = this.getPosition();
	    if( y!=0 ){
		this.getScrollBox().scrollTo( 0, y+tr.clientHeight);
	    }
	}
    },

    // コメントリフレクションを行う.
    reflection:function(comment){
	if( !NicoLiveHelper.iscaster ) return;
	if( comment.date<NicoLiveHelper.connecttime ) return;

	let name,disptype,color;
	if(NicoLiveCommentReflector[comment.user_id]){
	    name = NicoLiveCommentReflector[comment.user_id].name;
	    disptype = NicoLiveCommentReflector[comment.user_id].disptype;
	    color = NicoLiveCommentReflector[comment.user_id].color;
	}else{
	    return;
	}
	let str;
	switch(disptype){
	case 0:
	    str = LoadFormattedString('STR_NAME_POSTFIX',[name])+":<br>"+comment.text;
	    name = null;
	    break;
	case 1:// 運営コメ欄左上に名前.
	    //str = '　' + comment.text + '　';
	    str = '\u200b' + comment.text;
	    name = LoadFormattedString('STR_NAME_POSTFIX',[name]);
	    break;
	case 2:
	    // BSP
	    str = "/press show "+color+" \""+comment.text+"\" \""+name+"さん\"";
	    name = null;
	    break;
	}
	str = str.replace(/{=/g,'{-');
	if( disptype==2 ){
	    // BSPコメ
	    NicoLiveHelper.postCasterComment(str, "", name);
	}else{
	    let func = function(){
		NicoLiveHelper.postCasterComment(str, comment.mail, name, COMMENT_MSG_TYPE_NORMAL);
	    };
	    NicoLiveHelper.clearCasterCommentAndRun(func);
	}
    },

    /** コメントをコピーする.
     * @param node メニューがポップアップしたノード
     */
    copyComment:function(node){
	let elem = FindParentElement(node,'hbox');
	let str = window.getSelection().toString() || elem.textContent;
	CopyToClipboard(str);
    },

    showThumbnail:function(event,video_id){
	$('iframe-thumbnail').src = "http://ext.nicovideo.jp/thumb/"+video_id;
	let x,y;
	// 312x176
	x = event.clientX;
	y = event.clientY;
	if( y+176 > window.innerHeight ){
	    y = y - 176 - 10;
	}
	if( x+312 > window.innerWidth ){
	    x = x - 312 - 10;
	}

	$('iframe-thumbnail').style.left = x + 5 + "px";
	$('iframe-thumbnail').style.top = y + 5 + "px";
	$('iframe-thumbnail').style.display = 'block';
	$('iframe-thumbnail').width = 312;
	$('iframe-thumbnail').height = 176;
	$('iframe-thumbnail').style.opacity = 1;
    },
    hideThumbnail:function(){
//	$('iframe-thumbnail').style.display = 'none';
	$('iframe-thumbnail').width = 312;
	$('iframe-thumbnail').height = 0;
	$('iframe-thumbnail').style.opacity = 0;
    },

    postComment:function(textbox,event){
	let str = textbox.value;
	if(event && event.keyCode != 13) return true;

	textbox.controller.searchString = "";

	// update autocomplete
	let tmp = {value:str,comment:""};
	for(let i=0,item;item=this.autocomplete[i];i++){
	    if(item.value==str){
		this.autocomplete.splice(i,1);
	    }
	}
	this.autocomplete.unshift(tmp);
	if(this.autocomplete.length>10){
	    this.autocomplete.pop();
	}

	let concat_autocomplete = this.preset_autocomplete.concat( this.autocomplete );
	textbox.setAttribute("autocompletesearchparam",JSON.stringify(concat_autocomplete));

	let mail = $('textbox-mail').value;

	NicoLiveHelper.postCommentMain(str,mail,"");
	//NicoLiveTalker.runProcess("",str);

	textbox.value = "";
	return true;
    },

    addNGUser:function(userid){
	if( !NicoLiveHelper.iscaster ) return;
	if( !userid ) return;

	let req = new XMLHttpRequest();
	if(!req) return;
	req.onreadystatechange = function(){
	    if( req.readyState==4 && req.status==200 ){

	    }
	};
	let url = "http://watch.live.nicovideo.jp/api/configurengword?video="+NicoLiveHelper.request_id+"&mode=add&source="+userid+"&type=ID&use_case_unify=false";
	req.open('GET', url );
	req.send(null);
    },
    delNGUser:function(userid){
	if( !NicoLiveHelper.iscaster ) return;
	if( !userid ) return;

	let req = new XMLHttpRequest();
	if(!req) return;
	req.onreadystatechange = function(){
	    if( req.readyState==4 && req.status==200 ){

	    }
	};
	let url = "http://watch.live.nicovideo.jp/api/configurengword?video="+NicoLiveHelper.request_id+"&mode=delete&source="+userid+"&type=ID";
	req.open('GET', url );
	req.send(null);
    },

    // コメントリフレクタから削除する.
    removeFromCommentReflector:function(userid,name){
	NicoLiveComment.delNGUser(userid);
	let user = evaluateXPath(document,"//*[@comment-reflector='"+userid+"']");
	delete NicoLiveCommentReflector[userid];
	RemoveElement(user[0]);
	ShowNotice( LoadFormattedString('STR_OK_RELEASE_REFLECTION',[name,userid]) );

	// %Sさん　運営コメント:OFF
	let str = LoadFormattedString("STR_TURN_OFF_REFLECTION",[name]);
	NicoLiveHelper.postCasterComment(str,"");
    },

    addCommentReflectorCore:function(userid,name,disptype,addnguser,color){
	if(name && name.length){
	    let user = evaluateXPath(document,"//*[@comment-reflector='"+userid+"']");
	    NicoLiveCommentReflector[userid] = {"name":name, "disptype":disptype, "color":color };
	    if(user.length==0){
		// ここからリフレクション解除メニューの追加.
		let menuitem = CreateMenuItem( LoadFormattedString('STR_MENU_RELEASE_REFLECTION',[name]), userid);
		menuitem.setAttribute("comment-reflector",userid);
		menuitem.setAttribute("comment-name",name);
		menuitem.setAttribute("tooltiptext","ID="+userid);
		menuitem.setAttribute("oncommand","NicoLiveComment.removeFromCommentReflector('"+userid+"','"+name+"');");
		$('popup-comment').insertBefore(menuitem,$('id-release-reflection'));
		// ここまで
	    }else{
		user[0].setAttribute('label',LoadFormattedString('STR_MENU_RELEASE_REFLECTION',[name]));
	    }
	    ShowNotice( LoadFormattedString('STR_OK_REGISTER_REFRECTION',[userid,name]) );
	    if( addnguser ){
		debugprint(userid+'をNGユーザに追加します');
		//this.addNGUser(userid);
	    }
	    return true;
	}
	return false;
    },

    // リフレクション登録ダイアログを表示して設定する.
    showCommentReflectorDialog:function(userid, comment_no, defstring){
	if( !NicoLiveHelper.iscaster ) return;
	if( !userid ) return;
	if( !defstring ) defstring = "★";
	let param = {
	    "info": LoadFormattedString("STR_TEXT_REGISTER_REFLECTION",[userid]),
	    "default": defstring,
	    "disptype": 0,
	    "color": "white"
	};
	let f = "chrome,dialog,centerscreen,modal";
	if(NicoLivePreference.topmost){ f += ',alwaysRaised=yes'; }
	if( NicoLiveCommentReflector[userid] ){
	    param['default'] = NicoLiveCommentReflector[userid].name;
	}
	window.openDialog("chrome://nicolivehelper/content/commentdialog.xul","reflector",f,param);
	let name = param['default'];
	let disptype = param['disptype'];
	let color = param['color'];

	if(this.addCommentReflectorCore(userid, name, disptype, param.addnguser, color )){
	    // >>%S %Sさん　運営コメント:ON
	    let str;
	    if( !comment_no ) comment_no = "";
	    if( disptype==2 ){
		// BSP
		str = LoadFormattedString("STR_TURN_ON_REFLECTION_BSP",[comment_no, name]);
	    }else{
		str = LoadFormattedString("STR_TURN_ON_REFLECTION",[comment_no, name]);
	    }
	    NicoLiveHelper.postCasterComment(str,"");
	}
    },

    /** コメントリフレクション登録.
     * @param node メニューがポップアップしたノード
     */
    addCommentReflector:function(node){
	let userid = node.getAttribute('user_id');
	let comment_no = node.getAttribute('comment_no');
	this.showCommentReflectorDialog(userid, comment_no);
    },
    addReflectionFromCommentNo:function(comment_no){
	if(comment_no<=0) return;
	for(let i=0;i<this.commentlog.length;i++){
	    if( this.commentlog[i].no == comment_no ){
		this.showCommentReflectorDialog( this.commentlog[i].user_id, comment_no);
	    }
	}
    },

    releaseReflector:function(){
	// コメント反射を全解放.
	let cnt=0;
	for (u in NicoLiveCommentReflector){
	    // %Sさん　運営コメント:OFF
	    let name = NicoLiveCommentReflector[u].name;
	    let str = LoadFormattedString("STR_TURN_OFF_REFLECTION",[name]);
	    this.delNGUser(u);
	    NicoLiveHelper.postCasterComment(str,"");
	    cnt++;
	    delete NicoLiveCommentReflector[u];
	}

	try{
	    if(cnt) ShowNotice( LoadString('STR_OK_ALL_RELEASE_REFLECTION') );
	    let users = evaluateXPath(document,"//*[@comment-reflector]");
	    for(let i=0,user;user=users[i];i++){
		RemoveElement(user);
	    }
	} catch (x) {
	}
    },

    clearColorSetting:function(node){
	let userid = node.getAttribute('user_id');
	delete this.colormap[userid];
	this.updateCommentViewer();
    },

    changeColor:function(node){
	let userid = node.getAttribute('user_id');
	let color = $('comment-color').color;
	if( !color ) return;
	let now = GetCurrentTime();
	this.colormap[userid] = {"color":color,"date":now};
	for(id in this.colormap){
	    if( id>0 ) continue;
	    // 1週間経ったものは削除.
	    if( now-this.colormap[id].date > 7*24*60*60 ){
		delete this.colormap[id];
	    }
	}
	this.updateCommentViewer();
    },

    addKotehanDatabase:function(userid,name){
	if(name && name.length){
	    let now = GetCurrentTime();
	    let id;
	    this.namemap[userid] = {"name":name, date:now};
	    for(id in this.namemap){
		if( id>0 ) continue;
		// 1週間経ったものは削除.
		if( now-this.namemap[id].date > 7*24*60*60 ){
		    delete this.namemap[id];
		    debugprint(id+'のコテハン情報は1週間経ったため削除します');
		}
	    }
	    NicoLiveDatabase.saveGPStorage("nico_live_kotehan",this.namemap);
	}else if(name!=null){
	    delete this.namemap[userid];
	    NicoLiveDatabase.saveGPStorage("nico_live_kotehan",this.namemap);
	}
    },

    /** プロフィールページを開く.
     * @param node メニューがポップアップしたノード
     */
    openProfile:function(node){
	let userid = node.getAttribute('user_id');
	if(userid>0){
	    NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/user/'+userid);
	}
    },

    trackComment:function(node){
	let userid = node.getAttribute('user_id');
	let str = "";
	for(let i=0,item;item=this.commentlog[i];i++){
	    if( item.user_id==userid ){
		let datestr = GetDateString(item.date*1000);
		let name = item.name || this.namemap[item.user_id] && this.namemap[item.user_id].name || item.user_id;
		str += item.no+"\t"+name+"\t"+item.text+"\t"+datestr+"\n";
	    }
	}
	window.openDialog("chrome://nicolivehelper/content/commentlog.xul","comment","chrome,dialog,width=640,height=320,resizable=yes,centerscreen",str).focus();
    },

    addNameFromId:function(userid){
	if( !userid ) return;

	let name = InputPrompt( LoadFormattedString('STR_TEXT_SET_KOTEHAN',[userid]),
				LoadString('STR_CAPTION_SET_KOTEHAN'), this.namemap[userid]?this.namemap[userid].name:userid);

	this.addKotehanDatabase(userid,name);
	this.updateCommentsName(userid,name);
	this.createNameList();
    },

    /** コテハン登録.
     * @param node メニューがポップアップしたノード.
     */
    addName:function(node){
	let userid = node.getAttribute('user_id');
	this.addNameFromId(userid);
    },

    // 選択行のコテハン設定を削除.
    deleteKotehanFromListbox:function(){
	let n = $('kotehan-list').selectedIndex;
	if(n>=0){
	    let userid = $('kotehan-list').selectedItem.firstChild.value;
	    $('kotehan-list').removeItemAt(n);
	    delete this.namemap[userid];
	    NicoLiveDatabase.saveGPStorage("nico_live_kotehan",this.namemap);
	    this.updateCommentsName(userid,"");
	}
    },

    deleteKotehanAll:function(){
	let elem = $('kotehan-list');
	while(elem.itemCount>0){
	    elem.removeItemAt(0);
	}
	this.namemap = new Object();
	NicoLiveDatabase.saveGPStorage("nico_live_kotehan",this.namemap);
    },

    pressKeyOnNameList:function(e){
	if( e && e.keyCode==46 ){
	    // 46 は DELキー(Winで確認)
	    this.deleteKotehanFromListbox();
	}
    },

    createNameList:function(){
	let list = $('kotehan-list');
	while( list.getRowCount() ){
	    list.removeItemAt(0);
	}

	for (kotehan in this.namemap){
	    let elem = CreateElement('listitem');
	    elem.appendChild( CreateLabel(kotehan) );
	    elem.appendChild( CreateLabel(this.namemap[kotehan].name) );
	    list.appendChild(elem);
	}
    },

    /** 名前部分のみ更新.
     * @param user_id ユーザID
     * @param name 名前(false扱いにあるデータの場合はユーザIDに戻す)
     */
    updateCommentsName:function(user_id,name){
	let elems = evaluateXPath(document,"//*[@comment_by=\""+user_id+"\"]");
	if( !name ) name = user_id;
	for(let i=0,elem; elem=elems[i]; i++){
	    elem.textContent = name;
	}
    },

    updateCommentViewer:function(){
	clearTable($('comment_table'));
	this.prev_comment_no = 0;
	for(let i=0,item;item=this.commentlog[i];i++){
	    this.addRow(item,true);
	}
    },

    getNGWords:function(){
	// GET /api/configurengword?video=lv4635894&mode=get&video=lv4635894 HTTP/1.1
	// Host: watch.live.nicovideo.jp

	let req = new XMLHttpRequest();
	if( !req ) return;
	req.onreadystatechange = function(){
	    if( req.readyState==4 && req.status==200 ){
		NicoLiveComment.parseNGWordXML(req.responseXML);
	    }
	};
	let url = "http://watch.live.nicovideo.jp/api/configurengword?video="+NicoLiveHelper.request_id+"&mode=get";
	req.open('GET', url );
	req.send(null);
    },
    parseNGWordXML:function(xml){
	//this._tmpxml = xml;
	this.regexstrings = evaluateXPath(xml,"//ngclient[type='word' and @is_regex='true']/source");
	this.caseinsensitivestrings = evaluateXPath(xml,"//ngclient[type='word' and (not(@is_regex='true') and @use_case_unify='true')]/source");
	this.casesensitivestrings = evaluateXPath(xml,"//ngclient[type='word' and (not(@is_regex='true') and not(@use_case_unify='true'))]/source");

	let i,item;
	for(i=0;item=this.casesensitivestrings[i];i++){
	    this.casesensitivestrings[i] = item.textContent.replace(/\s+/g,'');
	}
	for(i=0;item=this.caseinsensitivestrings[i];i++){
	    this.caseinsensitivestrings[i] = HiraToKana(item.textContent).replace(/\s+/g,'');
	}
	for(i=0;item=this.regexstrings[i];i++){
	    this.regexstrings[i] = item.textContent.replace(/\s+/g,'');;
	}
    },

    // 引っかかったNGワードを返す.
    // 問題ないときはundefinedを返す.
    isNGWord:function(str){
	let i,item;
	let normalizedstr;
	// case-sensitiveなのでindexOfでOK
	for(i=0;item=this.casesensitivestrings[i];i++){
	    if( str.indexOf(item) != -1 ){
		return item;
	    }
	}

	// NGワードに()が含まれているとRegExpのコンパイルで例外発生.

	// case-insensitiveなので大文字小文字、ひらがなカタカナを区別しない.
	normalizedstr = HiraToKana(str);
	normalizedstr = ZenToHan(normalizedstr);
	normalizedstr = HanToZenKana(normalizedstr);
	for(i=0;item=this.caseinsensitivestrings[i];i++){
	    try{
		let regex = new RegExp(item,"i");
		if(normalizedstr.match(regex)){
		    return item;
		}
	    } catch (x) {
		debugprint(x+'/'+item);
	    }
	}
	// 正規表現.
	for(i=0;item=this.regexstrings[i];i++){
	    try{
		let regex = new RegExp(item);
		if(str.match(regex)){
		    return item;
		}
	    } catch (x) {
		debugprint(x+'/'+item);
	    }
	}
	return undefined;
    },

    openCommentLogDialog:function(){
	let str = "";
	for(let i=0,item;item=this.commentlog[i];i++){
	    let datestr = GetDateString(item.date*1000);
	    str += item.no+"\t"+item.user_id+"\t"+item.text+"\t"+datestr+"\n";
	}
	window.openDialog("chrome://nicolivehelper/content/commentlog.xul","comment","chrome,dialog,width=640,height=320,resizable=yes,centerscreen",str).focus();
    },

    push:function(chat){
	if(this.commentlog.length>=NicoLivePreference.log_num){
	    this.commentlog.shift();
	}
	this.commentlog.push(chat);

	// ここでファイルに書く.
	this.writeFile(chat);
    },

    getLogfileName:function(str){
	var date = new Date();
	var y,m,d;
	var h,min,sec;
	y = date.getFullYear();
	m = date.getMonth() + 1;
	d = date.getDate();
	h = date.getHours();
	min = date.getMinutes();
	sec = date.getSeconds();
	m = (m<10)?"0"+m:m;
	d = (d<10)?"0"+d:d;
	h = (h<10)?"0"+h:h;
	min = (min<10)?"0"+min:min;
	sec = (sec<10)?"0"+sec:sec;

	let replacefunc = function(s,p){
	    var tmp = s;
	    switch(p){
	    case 'request_id':
		tmp = NicoLiveHelper.request_id;
		break;
	    case 'title':
		tmp = NicoLiveHelper.title;
		break;
	    case 'year':
		tmp = y;
		break;
	    case 'month':
		tmp = m;
		break;
	    case 'date':
		tmp = d;
		break;
	    case 'hour':
		tmp = h;
		break;
	    case 'min':
		tmp = min;
		break;
	    case 'sec':
		tmp = sec;
		break;
	    }
	    return tmp;
	};
	return str.replace(/{(.*?)}/g,replacefunc);
    },

    openFile:function(request_id,community){
	let f = NicoLivePreference.getCommentDir();
	if(!f) return;
	if( community ){
	    f.append(community);
	    CreateFolder(f.path);
	}
	let fname = NicoLivePreference.getUnichar("logfile-name");
	fname = this.getLogfileName(fname);
	f.append(fname+'.txt');
	let file;
	let os;
	this.closeFile();

	var cnt=2;
	if( NicoLivePreference.getBool("new-logfile") ){
	    while( f.exists() ){
		debugprint("already exists comment log file:"+f.path);
		f.leafName = fname+"_"+cnt+".txt";
		cnt++;
	    }
	}

	try{
	    file = OpenFile(f.path);
	} catch (x) {
	    f = NicoLivePreference.getCommentDir();
	    if( community ){
		f.append(community);
		CreateFolder(f.path);
	    }
	    f.append(request_id+".txt");
	    file = OpenFile(f.path);
	}
	debugprint('open comment log:'+f.path);

	os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	let flags = 0x02|0x10|0x08;// wronly|append|create
	os.init(file,flags,0664,0);

	let cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
	cos.init(os,"UTF-8",0,Components.interfaces.nsIConverterOutputStream.DEFAULT_REPLACEMENT_CHARACTER);

	this.ostream = cos;

	cos.writeString('--- '+NicoLiveHelper.title+' ---\r\n');
    },
    closeFile:function(){
	try{
	    this.ostream.close();
	} catch (x) {
	}
    },

    writeFile:function(item){
	if(this.ostream){
	    let str;
	    let datestr = GetDateString(item.date*1000);
	    str = item.no+'\t'+item.user_id+'\t'+item.text+'\t'+datestr+"\r\n";
	    this.ostream.writeString(str);
	}
    },

    // ログファイルに任意の文字列を書き込む.
    writeMessageLog:function(str){
	if(this.ostream){
	    this.ostream.writeString(str+"\r\n");
	}
    },

    loadPresetAutocomplete:function(){
	let prefs = NicoLivePreference.getBranch();
	let str;
	try{
	    str = prefs.getUnicharPref("preset-autocomplete");	
	} catch (x) {
	    str = "";
	}
	let list = str.split(/\n|\r|\r\n/);
	this.preset_autocomplete = new Array();
	while(list.length){
	    let tmp = {};
	    let line = list.shift();
	    let data = line.split(",");
	    if(line.length){
		tmp.value = data[0];
		tmp.comment = data[1];
		this.preset_autocomplete.push(tmp);
	    }
	}
	let concat_autocomplete = this.preset_autocomplete.concat( this.autocomplete );
	$('textbox-comment').setAttribute("autocompletesearchparam",JSON.stringify(concat_autocomplete));
    },

    initView:function(){
	// ウィンドウ使いまわしで接続するときの初期化.
	this.commentlog = new Array();
	this.prev_comment_no = 0;
	this.current_comment_no = 0;
	clearTable($('comment_table'));
    },

    /** コメント内の動画へのリンクでのポップアップメニュー処理.
     * @param node メニューがポップアップしたノード.
     */
    setSelfRequest:function(node){
	let video_id = node.textContent;
	NicoLiveHelper.setSelfRequestFlag(video_id);
    },
    moveRequestToTop:function(node){
	let video_id = node.textContent;
	NicoLiveHelper.topToRequestById(video_id);
    },

    /** ID欄でのポップアップメニューの表示処理.
     * @param node ポップアップしたノード.
     */
    showPopupMenuForID:function(node){
	let userid = node.getAttribute('user_id');
	let commentno = node.getAttribute('comment_no');
	$('popup-comment-displayuserid').value = "No."+commentno+"/" + userid;
	if(userid>0){
	    $('popup-comment-openprofile').hidden = false;
	}else{
	    $('popup-comment-openprofile').hidden = true;
	}
    },

    // コメント用ポップアップメニュー表示処理.
    showPopupMenuForComment:function(elem){
	let str = window.getSelection().toString();
	if( str.match(/...[-+=/]....[-+=/]./) ){
	    $('comment-search-jasrac').hidden = false;
	    $('comment-search-elicense').hidden = true;
	}else if( str.match(/\d{5}/) ){
	    $('comment-search-jasrac').hidden = true;
	    $('comment-search-elicense').hidden = false;
	}else{
	    $('comment-search-jasrac').hidden = true;
	    $('comment-search-elicense').hidden = true;
	}
	if( str ){
	    elem.firstChild.hidden = false;
	}else{
	    elem.firstChild.hidden = true;
	}
    },

    saveKotehanToFile:function(){
	let obj = new Object();
	obj.namemap = this.namemap;
	obj.colormap = this.colormap;
	SaveObjectToFile(obj,"コテハン設定をファイルに保存");
    },
    loadKotehanFromFile:function(){
	let obj = LoadObjectFromFile("コテハン設定をファイルから読み込み");
	if( obj ){
	    this.namemap = obj.namemap;
	    this.colormap = obj.colormap;

	    NicoLiveDatabase.saveGPStorage("nico_live_kotehan",this.namemap);
	    NicoLiveDatabase.saveGPStorage("nico_live_colormap",this.colormap);

	    this.createNameList();
	    this.updateCommentViewer();
	}
    },

    initReflector:function(){
	for (u in NicoLiveCommentReflector){
	    // %Sさん　運営コメント:OFF
	    let name = NicoLiveCommentReflector[u].name;
	    let disptype = NicoLiveCommentReflector[u].disptype;
	    let color = NicoLiveCommentReflector[u].color;
	    this.addCommentReflectorCore( u, name, disptype, false, color );
	}
    },

    init:function(){
	// NGコメント.
	this.regexstrings = new Array();
	this.caseinsensitivestrings = new Array();
	this.casesensitivestrings = new Array();

	this.commentlog   = new Array();
	this.colormap = NicoLiveDatabase.loadGPStorage("nico_live_colormap",{});
	this.namemap = NicoLiveDatabase.loadGPStorage("nico_live_kotehan",{});
	this.autocomplete = NicoLiveDatabase.loadGPStorage("nico_live_autocomplete",[]);
	this.loadPresetAutocomplete();

	this.createNameList();

	// コメントリフレクターの登録用.
	this.initReflector();

	$('popup-comment').addEventListener('popupshowing',
					    function(event){
						NicoLiveComment.showPopupMenuForID(document.popupNode||$('popup-comment').triggerNode);
					    }, false);
    },
    destroy:function(){
	this.closeFile();
	for (a in this.colormap){
	    if( this.colormap[a].color.indexOf('color')==0 ){
		delete this.colormap[a];
	    }
	}
	NicoLiveDatabase.saveGPStorage("nico_live_colormap",this.colormap);
	NicoLiveDatabase.saveGPStorage("nico_live_autocomplete",this.autocomplete);
    }
};

window.addEventListener("load", function(e){ NicoLiveComment.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveComment.destroy(); }, false);
