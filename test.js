/**
 * @name RevengeEmbed
 * @version 1.0.0
 * @description Local /embed command that generates discord-custom-embeds links with your avatar
 * @author Assistant
 */

module.exports = (() => {
  const PLUGIN_ID = "RevengeEmbed";
  const AVATAR_URL = "https://i.imgur.com/yu0Yilc.jpeg"; // your avatar

  function createEl(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if(k === "style") Object.assign(el.style, v);
      else if(k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k,v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if(typeof c === "string") el.appendChild(document.createTextNode(c));
      else if(c) el.appendChild(c);
    });
    return el;
  }

  function insertIntoFocusedChat(text) {
    const selectors = [
      '[data-slate-editor="true"]',
      'div.ql-editor',
      'textarea'
    ];
    for(const sel of selectors){
      const el = document.querySelector(sel);
      if(!el) continue;
      if(el.isContentEditable){
        el.focus();
        document.execCommand("insertText", false, text);
        return true;
      }
      if(el.tagName === "TEXTAREA" || el.tagName === "INPUT"){
        el.focus();
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        el.value = el.value.slice(0,start) + text + el.value.slice(end);
        const newPos = start + text.length;
        el.setSelectionRange(newPos,newPos);
        el.dispatchEvent(new Event("input",{bubbles:true}));
        return true;
      }
    }
    return false;
  }

  function buildModal(onGenerate){
    const overlay = createEl("div",{id:`${PLUGIN_ID}-overlay`, style:{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",
      justifyContent:"center",zIndex:99999
    }});

    const box = createEl("div",{style:{
      width:"420px",maxWidth:"96%",background:"#2f3136",borderRadius:"10px",padding:"14px",
      boxShadow:"0 8px 30px rgba(0,0,0,0.6)",color:"var(--text-normal,#dcddde)",fontFamily:"var(--font-main,Whitney,Helvetica,Arial)"
    }});

    const title = createEl("div",{style:{fontSize:"16px",fontWeight:600,marginBottom:"10px"}},"Embed Generator");

    const fields = {};
    ["text","title","color","siteName","avatarType"].forEach(f=>{
      fields[f] = createEl("input",{placeholder:f,style:{
        width:"100%",padding:"8px",marginBottom:"8px",borderRadius:"6px",border:"1px solid rgba(0,0,0,0.2)",background:"#202225",color:"inherit"
      }});
    });
    fields.avatarType.value = "small"; // default
    fields.avatarType.disabled = true; // locked

    const btn = createEl("button",{onclick:()=>{
      const params = new URLSearchParams();
      params.set("text",fields.text.value || "");
      params.set("title",fields.title.value || "");
      params.set("color",fields.color.value || "ffffff");
      params.set("siteName",fields.siteName.value || "RevengeEmbed");
      params.set("avatarType",fields.avatarType.value);
      params.set("avatarUrl",AVATAR_URL);
      const url = `[⠀](https://discord-custom-embeds.vercel.app/embed?${params.toString()})`;
      onGenerate(url);
      overlay.remove();
    },style:{padding:"8px 10px",borderRadius:"6px",border:"none",cursor:"pointer"}},"Generate");

    const close = createEl("button",{onclick:()=>overlay.remove(),style:{padding:"8px 10px",borderRadius:"6px",border:"none",cursor:"pointer",marginLeft:"8px"}},"Cancel");

    box.appendChild(title);
    Object.values(fields).forEach(f=>box.appendChild(f));
    box.appendChild(createEl("div", {style:{marginTop:"10px",display:"flex",justifyContent:"flex-end"}},[btn,close]));

    overlay.appendChild(box);
    return overlay;
  }

  return class RevengeEmbed {
    constructor(){
      this._bound = this._checkCommand.bind(this);
    }

    start(){
      window.addEventListener("keydown",this._bound);
      console.log(`${PLUGIN_ID} started`);
    }

    stop(){
      window.removeEventListener("keydown",this._bound);
      const overlay = document.getElementById(`${PLUGIN_ID}-overlay`);
      if(overlay) overlay.remove();
      console.log(`${PLUGIN_ID} stopped`);
    }

    _checkCommand(e){
      if(e.key === "Enter"){
        const sel = document.activeElement;
        if(sel && (sel.isContentEditable || sel.tagName==="TEXTAREA" || sel.tagName==="INPUT")){
          const val = sel.innerText || sel.value || "";
          if(val.startsWith("/embed")){
            e.preventDefault();
            const overlay = buildModal((link)=>{
              if(sel.isContentEditable) sel.innerText = link;
              else sel.value = link;
              sel.focus();
            });
            document.body.appendChild(overlay);
          }
        }
      }
    }
  };
})();
