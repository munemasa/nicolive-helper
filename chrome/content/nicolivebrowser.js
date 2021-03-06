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
/*
 * 生放送タブ
 */
var NicoLiveBrowser = {

    open:function(){
	$('live-page').setAttribute('src','http://live.nicovideo.jp/watch/'+NicoLiveHelper.request_id);	
    },

    close:function(){
	$('live-page').setAttribute('src','about:blank');
    },

    initContent:function(){
	try{
	    //$('live-page').contentDocument.getElementById('flvplayer_container').style.display = 'block';
	    $('live-page').contentDocument.getElementById('footer').style.display = 'none';
	    $('live-page').contentDocument.getElementById('navi').style.display = 'none';
	    $('live-page').contentDocument.getElementById('header').style.display = 'none';
	    $('live-page').contentDocument.getElementById('nextprev').style.display = 'none';
	    $('live-page').contentDocument.getElementById('toTop').style.display = 'none';
	    let ichiba = $('live-page').contentDocument.getElementById('ichiba');
	    ichiba.children[1].style.display = 'none';
	} catch (x) {
	}
    },

    parseSearchingPage:function(){
	let tmp = $('live-page').contentDocument;
	//let videos = evaluateXPath(tmp,"//*[@class='thumb_vinfo']/table/tbody/tr/td[1]/p/a/@href");
	this._videos = evaluateXPath(tmp,"//*[@class='uad_thumbfrm' or @class='uad_thumbfrm_1' or @class='uad_thumbfrm_2']/table/tbody/tr/td/p/a/@href");

	this._uads = evaluateXPath(tmp,"//*[@class='vinfo_uadp']");

	setTimeout( function(e){
			debugprint('check page '+NicoLiveBrowser._page);
			if(NicoLiveBrowser._videos.length<=0){
			    debugprint('crawling done.');
			    debugprint('retry to crawl after 1min.');
			    // 検索失敗したみたいなので 1分待ってみる.
			    clearInterval(NicoLiveBrowser._crawlingtimer);
			    NicoLiveBrowser._crawlingtimer = setInterval( "NicoLiveBrowser.loadSearchingPage();", 60*1000 );
			    if( $('live-page').getAttribute('src')!='about:blank' ){
				setTimeout(function(){ NicoLiveBrowser.close(); }, 10*1000 );
			    }
			    return;
			}
			for(let i=0,item; item=NicoLiveBrowser._videos[i]; i++){
			    let d = item.textContent.match(/.+\/(.*?)$/);
			    let info = { "vid": d[1], "uadp": NicoLiveBrowser._uads[i].textContent.replace(/,/g,'') };
			    NicoLiveBrowser.ostream.writeString(d[1]+"\t"+(NicoLiveBrowser._uads[i].textContent.replace(/,/g,''))+"\r\n");
			}
			NicoLiveBrowser._page++;
			NicoLiveBrowser._crawlingtimer = setInterval( "NicoLiveBrowser.loadSearchingPage();", 5*1000 );
			NicoLiveDatabase.saveGPStorage("nico_mikusong_nextpage",NicoLiveBrowser._page);
		    }, 10*1000);
    },

    loadSearchingPage:function(){
	let url;
	// ミクオリジナル曲
	//url = "http://www.nicovideo.jp/tag/%E3%83%9F%E3%82%AF%E3%82%AA%E3%83%AA%E3%82%B8%E3%83%8A%E3%83%AB%E6%9B%B2?page="+this._page+"&sort=f&order=a";
	url = "http://www.nicovideo.jp/tag/%E3%83%9F%E3%82%AF%E3%82%AA%E3%83%AA%E3%82%B8%E3%83%8A%E3%83%AB%E6%9B%B2?page="+this._page+"&sort=f";

	// VOCALOID民族調
	//url = "http://www.nicovideo.jp/search/VOCALOID%E6%B0%91%E6%97%8F%E8%AA%BF?page="+this._page+"&sort=f&order=a";

	// VOCALOID和風曲
	//url = "http://www.nicovideo.jp/search/VOCALOID%E5%92%8C%E9%A2%A8%E6%9B%B2?page="+this._page+"&sort=f&order=a";

	// UTAU民族調曲
	//url = "http://www.nicovideo.jp/search/UTAU%E6%B0%91%E6%97%8F%E8%AA%BF%E6%9B%B2?page="+this._page+"&sort=f&order=a";

	// UTAU和風曲
	//url = "http://www.nicovideo.jp/search/UTAU%E5%92%8C%E9%A2%A8%E6%9B%B2?page="+this._page+"&sort=f&order=a";

	//url = "http://www.nicovideo.jp/tag/VOCALOID?page="+this._page+"&sort=f&order=a"; // VOCALOID
	//url = "http://www.nicovideo.jp/tag/JOYSOUND%E9%85%8D%E4%BF%A1%E6%B1%BA%E5%AE%9A?page="+this._page+"&sort=f&order=a"; // JOYSOUND配信決定
	//url = "http://www.nicovideo.jp/tag/JOYSOUND%E9%85%8D%E4%BF%A1%E4%B8%AD?page="+this._page+"&sort=f&order=a"; // JOYSOUND配信中
	debugprint(url);
	clearInterval(this._crawlingtimer);
	$('live-page').setAttribute('src',url);
    },

    saveFileMovieInfo:function(info,uadp){
	let f = NicoLivePreference.getCommentDir();
	if(!f) return;
	f.append(info.video_id+'.txt');
	let file,os;

	file = OpenFile(f.path);
	//debugprint('open comment log:'+f.path);

	os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	let flags = 0x02|0x20|0x08;// wronly|truncate|create
	os.init(file,flags,0664,0);

	let cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
	cos.init(os,"UTF-8",0,Components.interfaces.nsIConverterOutputStream.DEFAULT_REPLACEMENT_CHARACTER);

	let tmp = new Array();
	tmp.push(info.video_id);
	tmp.push(info.title);
	tmp.push(info.first_retrieve);
	tmp.push(info.length);
	tmp.push(info.view_counter);
	tmp.push(info.comment_num);
	tmp.push(info.mylist_counter);
	tmp.push(info.tags.join(' '));
	tmp.push(info.filesize);
	tmp.push(info.movie_type);
	tmp.push(uadp);
	cos.writeString(tmp.join("\t")+"\r\n");
	cos.close();
    },

    // getthumbinfoする.
    obtainVideoInfo:function(sm,uadp){
	var req = new XMLHttpRequest();
	if( !req ) return;
	req.onreadystatechange = function(){
	    if( req.readyState==4 && req.status==200 ){
		let info = NicoLiveHelper.xmlToMovieInfo(req.responseXML);
		if(!info){
		    debugprint("failed:"+sm);
		    return;
		}
		NicoLiveBrowser.saveFileMovieInfo(info,uadp);
	    }
	};
	let url = "http://ext.nicovideo.jp/api/getthumbinfo/"+sm;
	req.open('GET', url );
	req.send("");
    },

    obtainVideoInfos:function(){
	debugprint("obtain 100");
	for(let i=0;i<100;i++){
	    let cnt = this._counter;
	    if(this._mikusongs[cnt]){
		//debugprint(this._mikusongs[cnt].vid+"/"+this._mikusongs[cnt].uadp);
		this.obtainVideoInfo(this._mikusongs[cnt].vid, this._mikusongs[cnt].uadp);
	    }else{
		clearInterval(this._timer);
		debugprint('crawling done.');
	    }
	    this._counter++;
	}
    },

    saveMovieList:function(){
	let f = NicoLivePreference.getCommentDir();
	if(!f) return;
	f.append('videolist.txt');
	let file,os;

	file = OpenFile(f.path);
	debugprint('open file:'+f.path);

	os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	let flags = 0x02|0x20|0x08;// wronly|truncate|create
	os.init(file,flags,0664,0);

	let cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
	cos.init(os,"UTF-8",0,Components.interfaces.nsIConverterOutputStream.DEFAULT_REPLACEMENT_CHARACTER);

	let tmp = new Array();
	this._mikusongs = NicoLiveDatabase.loadGPStorage("nico_mikusongs",[]);
	for(let i=0,item;item=this._mikusongs[i];i++){
	    tmp.push(item.vid);
	}
	cos.writeString(tmp.join("\r\n"));
	cos.close();
    },

    readUnreadedVideos:function(){
	let f = NicoLivePreference.getCommentDir();
	if(!f) return;
	f.append('videofilelist.diff.txt');

	let istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
	    .createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(f, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);

	this._unreaded = new Object();

	// 行を配列に読み込む
	let line = {}, hasmore;
	let str = "";
	do {
	    hasmore = istream.readLine(line);
	    str = line.value;
	    this._unreaded["_"+str] = true;
	} while(hasmore);
	istream.close();
    },

    readData:function(){
	let f = NicoLivePreference.getCommentDir();
	if(!f) return;
	f.append('mikuoriginalsongs.csv');

	let istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
	    .createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(f, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);
	var cis = GetUTF8ConverterInputStream(istream);

	f = NicoLivePreference.getCommentDir();
	f.append('output.txt');
	let file,os;
	file = OpenFile(f.path);
	os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	let flags = 0x02|0x20|0x08;// wronly|truncate|create
	os.init(file,flags,0664,0);
	let cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
	cos.init(os,"UTF-8",0,Components.interfaces.nsIConverterOutputStream.DEFAULT_REPLACEMENT_CHARACTER);
	cis = cis.QueryInterface(Components.interfaces.nsILineInputStream);

	// 行を配列に読み込む
	let line = {}, hasmore;
	let str = "";
	let dayofweek = ["日","月","火","水","木","金","土"];
	let cnt=0;
	do {
	    hasmore = cis.readLine(line);
	    str = line.value;
	    let data = CSVToArray(str,"\t");
	    let date = new Date(data[2]*1000);
	    if(cnt++<10){
		debugprint(str);
	    }
	    data.unshift(date.getHours());
	    data.unshift(dayofweek[date.getDay()]);
	    data.unshift(date.getDate());
	    data.unshift(date.getMonth()+1);
	    data.unshift(date.getFullYear());
	    cos.writeString(data.join("\t")+"\r\n");
	} while(hasmore);
	cis.close();
	cos.close();
    },

    openUADPFile:function(){
	let f = NicoLivePreference.getCommentDir();
	if(!f) return;
	f.append('vocaloid-uadp.txt');
	let file,os;
	file = OpenFile(f.path);
	debugprint('open uadp file:'+f.path);

	os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	let flags = 0x02|0x10|0x08;// wronly|append|create
	os.init(file,flags,0664,0);
	let cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
	cos.init(os,"UTF-8",0,Components.interfaces.nsIConverterOutputStream.DEFAULT_REPLACEMENT_CHARACTER);

	this.ostream = cos;
	//cos.writeString('--- '+NicoLiveHelper.title+' ---\r\n');
    },

    _begincrawl:function(){
	// 2010/3/17 0:00:00
	if(!this._mikusongs){
	    this._mikusongs = NicoLiveDatabase.loadGPStorage("nico_mikusongs",[]);
	    for(let i=0,item; item=this._mikusongs[i]; i++){
		item.uadp = item.uadp.replace(/,/g,'');
	    }
	    this.readUnreadedVideos();
	    this._unreadedmikusongs = new Array();
	    for(let i=0,item; item=this._mikusongs[i]; i++){
		if( this._unreaded["_"+item.vid] ){
		    this._unreadedmikusongs.push(item);
		}
	    }
	    debugprint('unreaded:'+this._unreadedmikusongs.length);
	    this._mikusongs = this._unreadedmikusongs;

	    //this._mikusongs.sort(function(a,b){ return b.uadp-a.uadp; });
	    this._counter = 0;
	    debugprint("begin obtain videoinfos.");
	    this.obtainVideoInfos();
	    this._timer = setInterval("NicoLiveBrowser.obtainVideoInfos();",20*1000);
	}
    },

    // クロール開始.
    begincrawl:function(){
	this._page = NicoLiveDatabase.loadGPStorage("nico_mikusong_nextpage",1);
	if( this._page==1 ){
	    this._page = 1;
	    this.openUADPFile();
	    $('live-page').addEventListener('load',function(){ NicoLiveBrowser.parseSearchingPage(); },true );
	    this.loadSearchingPage();
	    debugprint('begin crawling');
	}else{
	    this.openUADPFile();
	    $('live-page').addEventListener('load',function(){ NicoLiveBrowser.parseSearchingPage(); },true );
	    this.loadSearchingPage();
	    debugprint('continue crawling');
	}
    },

    init:function(){
	$('live-page').addEventListener('load',function(){ NicoLiveBrowser.initContent(); },true );
    }
};

window.addEventListener('load',function(){NicoLiveBrowser.init();},false);
