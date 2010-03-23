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

var NicoLiveCommentProcessor = {

    addAutoKotehan:function(userid,name){
	NicoLiveComment.addKotehanDatabase(userid,name);
	NicoLiveComment.updateCommentViewer();
	NicoLiveComment.createNameList();
    },

    newProcessComment:function(xmlchat){
	NicoLiveCommentProcessor.oldprocesscomment(xmlchat);

	if( !$('auto-kotehan').checked ) return;
	let chat = NicoLiveHelper.extractComment(xmlchat);

	if(chat.date<NicoLiveHelper.connecttime){ return; } // 過去ログ無視.
	if(chat.premium>=2) return;
	let dat = chat.text.match(/[@＠]([^0-9０-９\s][^\s@]*?)$/);
	if(dat){
	    let name = dat[1];
	    if( name=="初見" ) return;
	    this.addAutoKotehan(chat.user_id,name);
	}
	if(chat.text.indexOf("ぼか生天気情報")!=-1){
	    
	}
    },

    init:function(){
	debugprint('Multi-purpose Comment Processor init.');
	this.oldprocesscomment = NicoLiveHelper.processComment;
	NicoLiveHelper.processComment = function(xmlchat){
	    NicoLiveCommentProcessor.newProcessComment(xmlchat);
	};
    },
    destroy:function(){
    }
};

window.addEventListener("load", function(e){ NicoLiveCommentProcessor.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveCommentProcessor.destroy(); }, false);
