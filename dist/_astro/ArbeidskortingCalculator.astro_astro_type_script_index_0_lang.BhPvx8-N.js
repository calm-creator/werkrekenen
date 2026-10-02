import{c as B}from"./calculations.CqSQGQp9.js";function M(){const i=document.getElementById("input-income"),c=document.getElementById("select-year"),l=document.getElementById("select-aow"),h=document.getElementById("btn-reset-arbeidskorting"),v=document.querySelectorAll(".btn-quick-income"),b=document.getElementById("alert-aow-during"),m=document.getElementById("res-hero-amount"),s=document.getElementById("res-hero-sub"),p=document.getElementById("box-explanation"),f=document.getElementById("res-spec-income"),u=document.getElementById("res-spec-annual"),g=document.getElementById("res-spec-monthly"),y=document.getElementById("res-spec-max"),x=document.getElementById("res-spec-bracket"),k=document.getElementById("res-spec-aow"),E=document.getElementById("res-spec-year"),I=document.getElementById("box-math-content");if(!i||!c||!l)return;const t=(o,r=2)=>new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",minimumFractionDigits:r,maximumFractionDigits:r}).format(o);function a(){const o=parseFloat(i?.value||"0"),r=parseInt(c?.value||"2026",10),d=l?.value||"none";v.forEach(n=>{const $=parseFloat(n.getAttribute("data-amount")||"0");Math.abs($-o)<1?n.classList.add("active"):n.classList.remove("active")}),b&&(b.style.display=d==="during"?"block":"none");const e=B({income:isNaN(o)?0:o,year:r,aowStatus:d});if(m&&(d==="during"&&e.indicativeMin!==void 0&&e.indicativeMax!==void 0?m.textContent=`${t(e.indicativeMin,0)} – ${t(e.indicativeMax,0)}`:m.textContent=t(e.arbeidskorting,0)),s&&(d==="during"?s.textContent=`Indicatieve bandbreedte in ${e.year} (afhankelijk van exacte AOW-maand)`:e.arbeidskorting===0?s.textContent=`per jaar in ${e.year}`:s.textContent=`per jaar in ${e.year} (~ ${t(e.arbeidskortingMonthly,0)} per maand)`),p&&(p.textContent=e.explanation),f&&(f.textContent=t(e.income,2)),u&&(d==="during"&&e.indicativeMin!==void 0&&e.indicativeMax!==void 0?u.textContent=`${t(e.indicativeMin,2)} – ${t(e.indicativeMax,2)}`:u.textContent=t(e.arbeidskorting,2)),g&&(d==="during"&&e.indicativeMin!==void 0&&e.indicativeMax!==void 0?g.textContent=`~ ${t(e.indicativeMin/12,2)} – ${t(e.indicativeMax/12,2)}`:g.textContent=`~ ${t(e.arbeidskortingMonthly,2)}`),y&&(y.textContent=t(e.maxArbeidskorting,2)),x&&(x.textContent=`Schijf ${e.bracketIndex} (${e.bracketRange})`),k&&(k.textContent=e.aowStatusLabel),E&&(E.textContent=String(e.year)),I){let n=`
          <p style="margin-bottom: 0.5rem;"><strong>Wettelijke formule (${e.bracketRange}):</strong></p>
          <div style="background-color: var(--bg-subtle); padding: 0.625rem 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid var(--color-primary); margin-bottom: 0.75rem;">
            <code>${e.formulaDescription}</code>
          </div>
        `;e.income<=0?n+='<p style="color: var(--text-muted); margin-bottom: 0;">Er is geen arbeidsinkomen ingevuld, waardoor de arbeidskorting uitkomt op € 0,00.</p>':e.income>132920?n+='<p style="color: var(--text-muted); margin-bottom: 0;">Het inkomen ligt boven de wettelijke afbouwgrens van € 132.920. De korting van maximaal € 5.685 is door de afbouw van 6,510% volledig verminderd tot € 0,00.</p>':d==="during"?n+=`
            <p style="color: var(--text-muted); margin-bottom: 0.5rem;">
              Voor werknemers die in de loop van het jaar de AOW-leeftijd bereiken, geldt een gewogen belastingtarief en tijdsevenredige korting:
            </p>
            <ul style="padding-left: 1.25rem; margin-bottom: 0.5rem; color: var(--text-muted);">
              <li>Reguliere tabel (onder AOW): ${t(e.indicativeMax??0,2)}</li>
              <li>AOW-tabel (volledig AOW): ${t(e.indicativeMin??0,2)}</li>
            </ul>
            <p style="color: var(--text-muted); margin-bottom: 0;">
              Het exacte bedrag hangt af van de precieze geboortedag en ingangsmaand van de AOW.
            </p>
          `:n+=`
            <ul style="padding-left: 1.25rem; margin-bottom: 0; color: var(--text-muted);">
              <li>Arbeidsinkomen: ${t(e.income,2)}</li>
              <li>Toegepaste schijf: Schijf ${e.bracketIndex}</li>
              <li>Berekend jaarbedrag: <strong>${t(e.arbeidskorting,2)}</strong></li>
              <li>Gemiddeld per maand: ~ ${t(e.arbeidskortingMonthly,2)} (als indicatie)</li>
            </ul>
          `,I.innerHTML=n}}i.addEventListener("input",a),i.addEventListener("change",a),c.addEventListener("change",a),l.addEventListener("change",a),v.forEach(o=>{o.addEventListener("click",()=>{const r=o.getAttribute("data-amount");r&&i&&(i.value=r,a())})}),h?.addEventListener("click",()=>{i&&(i.value="45000"),c&&(c.value="2026"),l&&(l.value="none"),a()}),a()}document.addEventListener("DOMContentLoaded",M);(document.readyState==="interactive"||document.readyState==="complete")&&M();
