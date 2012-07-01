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

var NicoLiveMenuControl = {

    /** テキストが範囲選択されていたら、指定のメニューの先頭に置いてある項目のみを表示.
     * @param elem メニュー要素
     */
    showOnlyFirstMenuItemIfTextSelected:function(elem){
	let str = window.getSelection().toString() || "";
	if( str ){
	    elem.firstChild.hidden = false;
	    elem.firstChild.nextSibling.hidden = false;
	    elem.firstChild.nextSibling.nextSibling.hidden = false;
	}else{
	    elem.firstChild.hidden = true;
	    elem.firstChild.nextSibling.hidden = true;
	    elem.firstChild.nextSibling.nextSibling.hidden = true;
	}
    },

    copyToClipboard:function(){
	let str = window.getSelection().toString() || "";
	CopyToClipboard(str);
    },

    searchByGoogle:function(){
	let str = window.getSelection().toString() || "";
	debugprint("search:"+str);
	let url = "http://www.google.com/search?q="+encodeURIComponent(str);
	NicoLiveWindow.openDefaultBrowser(url,true);
    },
    searchByNicoNico:function(){
	let str = window.getSelection().toString() || "";
	debugprint("search:"+str);
	let url = "http://www.nicovideo.jp/search/"+encodeURIComponent(str);
	NicoLiveWindow.openDefaultBrowser(url,true);
    }
};
