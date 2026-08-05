(() => {
  'use strict';

  const modalHTML = `
  <div class="overlay" id="separateExportModal">
    <div class="modal export-choice-modal">
      <h3>Export Measurements</h3>
      <p class="export-help">Choose a file type. Both files use the same name.</p>
      <div class="export-choice-grid">
        <button id="exportExcelOnly" class="export-choice excel">📊<span>Export Excel</span><small>.xlsx</small></button>
        <button id="exportPdfOnly" class="export-choice pdf">📄<span>Export PDF</span><small>.pdf</small></button>
        <button id="exportBothSeparate" class="export-choice both">📧<span>Share Both</span><small>Excel, then PDF</small></button>
      </div>
      <div class="actions"><button class="cancel" id="separateExportClose">Cancel</button></div>
    </div>
  </div>
  <div class="overlay" id="continuePdfModal">
    <div class="modal export-choice-modal">
      <h3>Excel Complete</h3>
      <p class="export-help">Tap below to share the matching PDF as a separate attachment.</p>
      <div class="actions">
        <button class="cancel" id="cancelSecondExport">Done</button>
        <button class="confirm" id="continuePdfExport">Share PDF</button>
      </div>
    </div>
  </div>`;

  const css = `
    .export-choice-modal{width:min(92vw,430px)}
    .export-help{margin:0 0 14px;color:var(--ink-soft);font-size:13px;line-height:1.4}
    .export-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
    .export-choice{min-height:86px;border:1px solid var(--line);border-radius:11px;background:var(--white);color:var(--navy);font-family:var(--sans);font-size:25px;font-weight:700;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px}
    .export-choice span{font-size:14px}.export-choice small{font-size:10px;color:var(--ink-soft);font-weight:600}
    .export-choice:active{transform:scale(.98)}
    .export-choice.excel{border-color:#638d6e}.export-choice.pdf{border-color:#b56a55}
    .export-choice.both{grid-column:1/-1;background:var(--navy);color:#fff;border-color:var(--navy)}
    .export-choice.both small{color:#c7d2dc}
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const exportModal = document.getElementById('separateExportModal');
  const continueModal = document.getElementById('continuePdfModal');
  let pendingPdfFile = null;

  function openExportModal(){ exportModal.classList.add('show'); }
  function closeExportModal(){ exportModal.classList.remove('show'); }
  function closeContinueModal(){ continueModal.classList.remove('show'); pendingPdfFile=null; }

  async function shareOne(file, message){
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{
        await navigator.share({files:[file], title:file.name, text:message});
        return true;
      }catch(err){
        if(err && err.name === 'AbortError') return false;
        console.error(err);
      }
    }
    if(typeof downloadFile === 'function') downloadFile(file);
    else {
      const url=URL.createObjectURL(file);
      const a=document.createElement('a'); a.href=url; a.download=file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }
    return true;
  }

  function getName(){
    if(typeof askForFileName !== 'function') return null;
    return askForFileName();
  }

  async function exportExcel(){
    const baseName=getName(); if(!baseName) return;
    closeExportModal();
    const ok=await shareOne(buildExcelFile(baseName),'Maintenance quantities Excel file.');
    if(ok && typeof showToast==='function') showToast('Excel ready.');
  }

  async function exportPdf(){
    const baseName=getName(); if(!baseName) return;
    closeExportModal();
    const ok=await shareOne(buildPdfFile(baseName),'Maintenance quantities PDF file.');
    if(ok && typeof showToast==='function') showToast('PDF ready.');
  }

  async function exportBoth(){
    const baseName=getName(); if(!baseName) return;
    closeExportModal();
    const excelFile=buildExcelFile(baseName);
    pendingPdfFile=buildPdfFile(baseName);
    const ok=await shareOne(excelFile,'Maintenance quantities Excel file. The matching PDF will be shared next.');
    if(ok) continueModal.classList.add('show');
    else pendingPdfFile=null;
  }

  // Capture the click before the old ZIP/multi-file listener can run.
  document.addEventListener('click', event => {
    const btn=event.target.closest('#exportBtn');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openExportModal();
  }, true);

  const exportButton=document.getElementById('exportBtn');
  if(exportButton) exportButton.textContent='⇪ Export';

  document.getElementById('exportExcelOnly').onclick=exportExcel;
  document.getElementById('exportPdfOnly').onclick=exportPdf;
  document.getElementById('exportBothSeparate').onclick=exportBoth;
  document.getElementById('separateExportClose').onclick=closeExportModal;
  document.getElementById('cancelSecondExport').onclick=closeContinueModal;
  document.getElementById('continuePdfExport').onclick=async()=>{
    if(!pendingPdfFile){ closeContinueModal(); return; }
    const file=pendingPdfFile;
    closeContinueModal();
    const ok=await shareOne(file,'Maintenance quantities PDF file.');
    if(ok && typeof showToast==='function') showToast('PDF ready.');
  };
  exportModal.onclick=e=>{if(e.target===exportModal) closeExportModal();};
  continueModal.onclick=e=>{if(e.target===continueModal) closeContinueModal();};
})();
