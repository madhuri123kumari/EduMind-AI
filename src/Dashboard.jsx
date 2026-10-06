import { useCallback, useEffect, useMemo, useState } from "react";

import {
  signOut,
  updateProfile,
  updatePassword,
  sendEmailVerification,
} from "firebase/auth";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase.jsx";

/*
 * EduMind AI Dashboard
 *
 * Firebase collection:
 * students
 *
 * Fields:
 * name
 * className
 * attendance
 * performance
 * ownerUid
 * createdAt
 *
 * Real AI analysis uses the separately configured backend.
 */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

:root{
  font-family:'DM Sans',sans-serif;
  color:#eef1ff;
  background:#080d19;
  font-synthesis:none;
  text-rendering:optimizeLegibility;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  min-width:320px;
  background:#080d19;
}

button,
input,
select{
  font:inherit;
}

button{
  cursor:pointer;
}

button:disabled{
  opacity:.6;
  cursor:not-allowed;
}

.em-dashboard{
  display:flex;
  min-height:100vh;
  background:
    radial-gradient(ellipse at 70% 0,#1b2450 0,transparent 38%),
    #080d19;
}

.em-sidebar{
  width:250px;
  flex-shrink:0;
  display:flex;
  flex-direction:column;
  padding:24px 14px;
  background:#0e1627;
  border-right:1px solid #263149;
}

.em-brand{
  display:flex;
  align-items:center;
  gap:12px;
  padding:0 8px 34px;
}

.em-logo{
  display:grid;
  place-items:center;
  width:43px;
  height:43px;
  border-radius:13px;
  background:linear-gradient(135deg,#8278ff,#5145cf);
  font-size:24px;
  font-weight:800;
}

.em-brand b{
  font-family:Manrope,sans-serif;
  font-size:19px;
}

.em-brand em{
  font-style:normal;
  color:#9b94ff;
}

.em-brand small{
  display:block;
  margin-top:4px;
  color:#8795b1;
  font-size:9px;
  letter-spacing:1.3px;
}

.em-label{
  padding:0 12px 12px;
  color:#7584a3;
  font-size:10px;
  letter-spacing:1.5px;
}

.em-nav{
  display:grid;
  gap:6px;
}

.em-nav button{
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  padding:13px;
  border:1px solid transparent;
  border-radius:10px;
  background:transparent;
  color:#b8c4de;
  text-align:left;
  font-size:13px;
}

.em-nav button:hover{
  background:#1b2740;
}

.em-nav button.active{
  background:#4038a7;
  border-color:#625be4;
  color:white;
}

.em-nav .em-icon{
  width:22px;
  font-size:20px;
  text-align:center;
}

.em-pill{
  margin-left:auto;
  padding:3px 6px;
  border-radius:5px;
  background:#28265d;
  color:#c8c3ff;
  font-size:9px;
}

.em-account{
  margin-top:auto;
  padding-top:25px;
}

.em-profile{
  display:flex;
  align-items:center;
  gap:10px;
  padding:12px 8px;
  border:1px solid #29364d;
  border-radius:11px;
  background:#121d30;
}

.em-avatar{
  display:grid;
  place-items:center;
  width:38px;
  height:38px;
  flex-shrink:0;
  border-radius:50%;
  background:#6258db;
  font-weight:800;
}

.em-profile div:last-child{
  min-width:0;
}

.em-profile b,
.em-profile small{
  display:block;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.em-profile b{
  font-size:12px;
}

.em-profile small{
  max-width:155px;
  margin-top:4px;
  color:#91a0bd;
  font-size:10px;
}

.em-logout{
  width:100%;
  margin-top:8px;
  padding:11px;
  border:0;
  background:transparent;
  color:#b3bfd8;
  text-align:left;
  font-size:12px;
}

.em-main{
  flex:1;
  min-width:0;
}

.em-topbar{
  position:sticky;
  top:0;
  z-index:3;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  min-height:90px;
  padding:18px 30px;
  border-bottom:1px solid #263149;
  background:#0c1424ed;
  backdrop-filter:blur(12px);
}

.em-kicker{
  color:#8795b1;
  font-size:9px;
  letter-spacing:1.5px;
}

.em-topbar h1{
  margin:6px 0 0;
  font-family:Manrope,sans-serif;
  font-size:24px;
}

.em-search{
  display:flex;
  align-items:center;
  gap:10px;
  width:min(360px,45%);
  padding:11px 13px;
  border:1px solid #2b3952;
  border-radius:10px;
  background:#141f32;
}

.em-search input{
  width:100%;
  border:0;
  outline:0;
  background:transparent;
  color:white;
  font-size:12px;
}

.em-content{
  max-width:1650px;
  margin:auto;
  padding:27px 30px;
}

.em-welcome{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  margin-bottom:22px;
  color:#a5b2cc;
  font-size:13px;
}

.em-date{
  padding:9px 12px;
  border:1px solid #293750;
  border-radius:9px;
  background:#111b2c;
  font-size:11px;
}

.em-alert{
  display:flex;
  justify-content:space-between;
  gap:12px;
  margin-bottom:16px;
  padding:12px 14px;
  border:1px solid;
  border-radius:9px;
  font-size:12px;
  line-height:1.5;
  overflow-wrap:anywhere;
}

.em-alert button{
  border:0;
  background:transparent;
  color:inherit;
}

.em-error{
  border-color:#703143;
  background:#371b2a;
  color:#ffb5bc;
}

.em-success{
  border-color:#205c4c;
  background:#102e2a;
  color:#9aefc7;
}

.em-stats{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:14px;
  margin-bottom:18px;
}

.em-stats.three{
  grid-template-columns:repeat(3,minmax(0,1fr));
}

.em-stat{
  display:flex;
  gap:13px;
  min-width:0;
  min-height:120px;
  padding:17px;
  border:1px solid #2a3850;
  border-radius:13px;
  background:linear-gradient(140deg,#192641,#111a2b);
}

.em-stat.mint{
  background:linear-gradient(140deg,#12352f,#111d2a);
}

.em-stat.rose{
  background:linear-gradient(140deg,#351c34,#151b2c);
}

.em-stat.amber{
  background:linear-gradient(140deg,#382c1d,#171d2b);
}

.em-stat-icon{
  display:grid;
  place-items:center;
  width:40px;
  height:40px;
  flex-shrink:0;
  border-radius:11px;
  background:#4039a9;
  font-size:21px;
}

.em-stat.mint .em-stat-icon{
  background:#17694f;
}

.em-stat.rose .em-stat-icon{
  background:#7b2c59;
}

.em-stat.amber .em-stat-icon{
  background:#765021;
}

.em-stat-info{
  display:grid;
  align-content:start;
  gap:7px;
  min-width:0;
}

.em-stat-info span{
  color:#b4c0db;
  font-size:11px;
}

.em-stat-info strong{
  font-family:Manrope,sans-serif;
  font-size:26px;
}

.em-stat-info small{
  color:#8798b8;
  font-size:10px;
  line-height:1.5;
}

.em-grid{
  display:grid;
  grid-template-columns:minmax(0,1.4fr) minmax(280px,1fr);
  gap:17px;
}

.em-panel{
  min-width:0;
  margin-bottom:18px;
  padding:20px;
  border:1px solid #26354c;
  border-radius:14px;
  background:linear-gradient(145deg,#131f32,#0f1828);
}

.em-panel-head{
  display:flex;
  justify-content:space-between;
  gap:15px;
  margin-bottom:18px;
}

.em-panel-head h2,
.em-ai h2{
  margin:0;
  font-family:Manrope,sans-serif;
  font-size:16px;
}

.em-panel-head p,
.em-ai p{
  margin:6px 0 0;
  color:#8f9fbd;
  font-size:11px;
  line-height:1.6;
}

.em-button{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:39px;
  padding:10px 14px;
  border:1px solid transparent;
  border-radius:9px;
  font-size:11px;
  font-weight:700;
}

.em-primary{
  background:linear-gradient(105deg,#5148d1,#7067f2);
  color:white;
}

.em-secondary{
  border-color:#4542a2;
  background:#27275e;
  color:#d9d7ff;
}

.em-ghost{
  border-color:#35445e;
  background:transparent;
  color:#b9c5dd;
}

.em-form{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
}

.em-form label{
  display:grid;
  gap:7px;
  color:#c6d0e6;
  font-size:11px;
  font-weight:600;
}

.em-form input,
.em-select{
  width:100%;
  min-width:0;
  min-height:42px;
  padding:10px 12px;
  border:1px solid #34435c;
  border-radius:9px;
  outline:0;
  background:#0d1727;
  color:#f2f4ff;
  font-size:12px;
}

.em-form input:focus,
.em-select:focus{
  border-color:#8178ff;
  box-shadow:0 0 0 3px #8178ff1c;
}

.em-actions{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  grid-column:1/-1;
}

.em-note{
  margin-top:15px;
  color:#8191ad;
  font-size:10px;
  line-height:1.6;
}

.em-table-wrap{
  width:100%;
  overflow-x:auto;
}

.em-table{
  width:100%;
  border-collapse:collapse;
  text-align:left;
  font-size:11px;
  white-space:nowrap;
}

.em-table th{
  padding:11px 9px;
  background:#1a2940;
  color:#aebcda;
  font-size:10px;
}

.em-table td{
  padding:12px 9px;
  border-bottom:1px solid #202d43;
  color:#bfcae0;
}

.em-table td b{
  color:#edf0ff;
}

.em-meter{
  display:grid;
  grid-template-columns:36px 58px;
  align-items:center;
  gap:7px;
}

.em-meter span{
  font-size:10px;
}

.em-track{
  height:5px;
  overflow:hidden;
  border-radius:9px;
  background:#27364d;
}

.em-track i{
  display:block;
  height:100%;
  border-radius:9px;
  background:#46d6ac;
}

.em-track i.rose{
  background:#f27eae;
}

.em-actions-row{
  display:flex;
  gap:9px;
}

.em-link{
  padding:3px 0;
  border:0;
  background:transparent;
  color:#aaa4ff;
  font-size:10px;
  font-weight:700;
}

.em-delete{
  color:#ff9aaa;
}

.em-status{
  padding:5px 7px;
  border-radius:6px;
  font-size:9px;
  font-weight:700;
}

.em-status.risk{
  background:#3a2a1a;
  color:#f4c274;
}

.em-status.good{
  background:#12382f;
  color:#79e0bc;
}

.em-empty{
  padding:35px 15px;
  color:#91a0bd;
  text-align:center;
  font-size:12px;
}

.em-insight{
  display:flex;
  gap:12px;
  padding:13px 0;
  border-bottom:1px solid #253149;
}

.em-dot{
  width:9px;
  height:9px;
  flex-shrink:0;
  margin-top:4px;
  border-radius:50%;
  background:#4bd2a6;
}

.em-dot.amber{
  background:#f0b759;
}

.em-insight b{
  font-size:12px;
}

.em-insight p{
  margin:5px 0 0;
  color:#91a0bd;
  font-size:11px;
  line-height:1.5;
}

.em-callout{
  margin-top:17px;
  padding:15px;
  border:1px solid #39356f;
  border-radius:10px;
  background:#211e4d;
}

.em-callout b{
  font-size:12px;
}

.em-callout p{
  color:#a8b2d0;
  font-size:11px;
  line-height:1.6;
}

.em-ai-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
}

.em-ai-warning{
  margin:20px 0;
  padding:12px;
  border:1px solid #4d3d29;
  border-radius:9px;
  background:#2a2119;
  color:#e7c58f;
  font-size:11px;
  line-height:1.5;
}

.em-ai-result{
  padding:0;
  margin-top:18px;
  border:1px solid #2b3d56;
  border-radius:14px;
  background:#0b1423;
  overflow:hidden;
}

.em-ai-result-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding:18px 20px;
  border-bottom:1px solid #26364f;
  background:#101b2d;
}

.em-ai-result-label{
  display:block;
  margin-bottom:5px;
  color:#8d9dbc;
  font-size:9px;
  font-weight:800;
  letter-spacing:1.5px;
}

.em-ai-result-header h3{
  margin:0;
  color:#edf2ff;
  font-size:16px;
  font-weight:700;
}

.em-ai-live{
  padding:6px 10px;
  border:1px solid #275b4b;
  border-radius:999px;
  background:#102d26;
  color:#79e0bc;
  font-size:10px;
  font-weight:700;
  white-space:nowrap;
}

.em-ai-content{
  padding:20px;
}

.em-ai-section-title{
  margin:24px 0 10px;
  padding-bottom:9px;
  border-bottom:1px solid #26364f;
  color:#f0f3ff;
  font-size:15px;
  line-height:1.4;
}

.em-ai-section-title:first-child{
  margin-top:0;
}

.em-ai-paragraph{
  margin:8px 0;
  color:#aebbd4;
  font-size:12px;
  line-height:1.75;
}

.em-ai-paragraph strong,
.em-ai-list strong{
  color:#e9edff;
  font-weight:700;
}

.em-ai-list{
  margin:8px 0 16px;
  padding-left:22px;
  color:#aebbd4;
}

.em-ai-list li{
  margin:7px 0;
  padding-left:4px;
  font-size:12px;
  line-height:1.7;
}

.em-ai-list li::marker{
  color:#7c6cf2;
}

.em-ai-content em{
  color:#b8c4dd;
}

.em-metrics{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
  margin-top:18px;
}

.em-metrics span{
  display:grid;
  gap:6px;
  padding:12px;
  border:1px solid #29364d;
  border-radius:9px;
  color:#91a0bd;
  font-size:10px;
}

.em-metrics b{
  color:#e9edff;
  font-size:18px;
}

.em-report-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:12px;
  margin:20px 0;
}

.em-report-grid div{
  display:grid;
  gap:8px;
  padding:14px;
  border:1px solid #29374f;
  border-radius:10px;
  background:#111b2d;
}

.em-report-grid span{
  color:#92a1bd;
  font-size:10px;
}

.em-report-grid b{
  font-size:21px;
}

/* SETTINGS */

.em-settings-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:17px;
}

.em-settings-card{
  min-width:0;
  padding:20px;
  border:1px solid #26354c;
  border-radius:14px;
  background:linear-gradient(145deg,#131f32,#0f1828);
}

.em-settings-card.full{
  grid-column:1/-1;
}

.em-settings-head{
  display:flex;
  align-items:flex-start;
  gap:12px;
  margin-bottom:20px;
}

.em-settings-icon{
  display:grid;
  place-items:center;
  width:40px;
  height:40px;
  flex-shrink:0;
  border-radius:10px;
  background:#28265d;
  color:#bcb8ff;
  font-size:18px;
}

.em-settings-head h2{
  margin:0;
  font-family:Manrope,sans-serif;
  font-size:15px;
}

.em-settings-head p{
  margin:5px 0 0;
  color:#8798b8;
  font-size:10px;
  line-height:1.5;
}

.em-settings-form{
  display:grid;
  gap:14px;
}

.em-settings-form label{
  display:grid;
  gap:7px;
  color:#c6d0e6;
  font-size:11px;
  font-weight:600;
}

.em-settings-form input{
  width:100%;
  min-height:43px;
  padding:10px 12px;
  border:1px solid #34435c;
  border-radius:9px;
  outline:none;
  background:#0d1727;
  color:#f2f4ff;
  font-size:12px;
}

.em-settings-form input:focus{
  border-color:#8178ff;
  box-shadow:0 0 0 3px #8178ff1c;
}

.em-settings-form input:disabled{
  cursor:not-allowed;
  opacity:.65;
}

.em-verification-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:12px;
  border:1px solid #29374f;
  border-radius:9px;
  background:#101a2b;
}

.em-verification-status{
  display:flex;
  align-items:center;
  gap:7px;
  font-size:10px;
  font-weight:700;
}

.em-verification-status.verified{
  color:#79e0bc;
}

.em-verification-status.unverified{
  color:#f4c274;
}

.em-security-note{
  padding:11px 12px;
  border:1px solid #29374f;
  border-radius:9px;
  background:#101a2b;
  color:#8798b8;
  font-size:10px;
  line-height:1.6;
}

.em-setting-options{
  display:grid;
  gap:10px;
}

.em-setting-toggle{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  padding:14px;
  border:1px solid #29374f;
  border-radius:10px;
  background:#101a2b;
}

.em-setting-toggle-text{
  min-width:0;
}

.em-setting-toggle-text b{
  display:block;
  color:#e9edff;
  font-size:11px;
}

.em-setting-toggle-text span{
  display:block;
  margin-top:4px;
  color:#8191ad;
  font-size:10px;
  line-height:1.5;
}

.em-toggle{
  position:relative;
  width:44px;
  height:24px;
  flex-shrink:0;
}

.em-toggle input{
  position:absolute;
  width:1px;
  height:1px;
  opacity:0;
}

.em-toggle-slider{
  position:absolute;
  inset:0;
  border-radius:20px;
  background:#29374f;
  transition:.2s;
}

.em-toggle-slider::before{
  content:"";
  position:absolute;
  width:18px;
  height:18px;
  left:3px;
  top:3px;
  border-radius:50%;
  background:#aeb9d0;
  transition:.2s;
}

.em-toggle input:checked + .em-toggle-slider{
  background:#5148d1;
}

.em-toggle input:checked + .em-toggle-slider::before{
  transform:translateX(20px);
  background:white;
}

.em-account-details{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px;
}

.em-account-details div{
  padding:12px;
  border:1px solid #29374f;
  border-radius:9px;
  background:#101a2b;
}

.em-account-details span{
  display:block;
  color:#8191ad;
  font-size:9px;
}

.em-account-details b{
  display:block;
  margin-top:5px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:#e8ecff;
  font-size:11px;
}

.em-settings-danger{
  margin-top:15px;
  padding-top:15px;
  border-top:1px solid #29374f;
}

.em-danger{
  border-color:#713448;
  background:#351b29;
  color:#ffb5bc;
}

.em-footer{
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding:18px 2px;
  color:#667693;
  font-size:10px;
}

@media(max-width:1150px){
  .em-sidebar{
    width:220px;
  }

  .em-content{
    padding:22px;
  }

  .em-stats{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .em-grid{
    grid-template-columns:1fr;
  }
}

@media(max-width:900px){
  .em-settings-grid{
    grid-template-columns:1fr;
  }

  .em-settings-card.full{
    grid-column:auto;
  }
}

@media(max-width:760px){
  .em-sidebar{
    width:65px;
    padding:16px 6px;
  }

  .em-brand{
    justify-content:center;
    padding:0 0 26px;
  }

  .em-brand>div,
  .em-label,
  .em-nav button .em-text,
  .em-pill,
  .em-profile div:last-child,
  .em-logout .em-logout-text{
    display:none;
  }

  .em-nav button{
    justify-content:center;
    padding:12px 3px;
  }

  .em-nav .em-icon{
    font-size:21px;
  }

  .em-profile{
    justify-content:center;
    padding:7px 2px;
  }

  .em-logout{
    text-align:center;
    padding:10px 0;
  }

  .em-topbar{
    align-items:flex-start;
    flex-direction:column;
    gap:12px;
    padding:17px;
  }

  .em-search{
    width:100%;
  }

  .em-content{
    padding:18px 13px;
  }

  .em-welcome{
    align-items:flex-start;
  }

  .em-form{
    grid-template-columns:1fr;
  }

  .em-actions{
    grid-column:auto;
  }

  .em-report-grid,
  .em-metrics{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .em-ai-head{
    align-items:flex-start;
    flex-direction:column;
  }

  .em-ai-head .em-button{
    width:100%;
  }

  .em-ai-result-header{
    align-items:flex-start;
    flex-direction:column;
  }

  .em-ai-content{
    padding:16px;
  }

  .em-ai-section-title{
    font-size:14px;
  }

  .em-footer{
    flex-direction:column;
  }

  .em-verification-row{
    align-items:flex-start;
    flex-direction:column;
  }

  .em-account-details{
    grid-template-columns:1fr;
  }
}

@media(max-width:450px){
  .em-sidebar{
    width:54px;
    padding:13px 4px;
  }

  .em-stats,
  .em-stats.three{
    grid-template-columns:1fr;
    gap:9px;
  }

  .em-stat{
    min-height:90px;
  }

  .em-panel,
  .em-settings-card{
    padding:14px;
  }

  .em-topbar h1{
    font-size:21px;
  }

  .em-date{
    font-size:9px;
  }

  .em-report-grid{
    gap:8px;
  }

  .em-report-grid b{
    font-size:18px;
  }
}
`;

const NAV = [
  ["overview", "⌂", "Overview"],
  ["students", "♙", "Students"],
  ["attendance", "▦", "Attendance"],
  ["performance", "▥", "Performance"],
  ["insights", "✧", "AI Insights"],
  ["reports", "▤", "Reports"],
  ["settings", "⚙", "Settings"],
];

const EMPTY_FORM = {
  name: "",
  className: "",
  attendance: "",
  performance: "",
};

function verifiedUser() {
  const current = auth.currentUser;

  if (!current || !current.emailVerified) {
    throw new Error("Please sign in with your verified email first.");
  }

  return current;
}

function validateStudent(input) {
  const name = String(input.name ?? "").trim();
  const className = String(input.className ?? "").trim();
  const attendance = Number(input.attendance);
  const performance = Number(input.performance);

  if (!name || !className) {
    throw new Error("Student name and class/course are required.");
  }

  if (
    !Number.isFinite(attendance) ||
    attendance < 0 ||
    attendance > 100
  ) {
    throw new Error("Attendance must be between 0 and 100.");
  }

  if (
    !Number.isFinite(performance) ||
    performance < 0 ||
    performance > 100
  ) {
    throw new Error("Performance must be between 0 and 100.");
  }

  return {
    name,
    className,
    attendance,
    performance,
  };
}

async function addStudent(input) {
  const current = verifiedUser();

  const data = {
    ...validateStudent(input),
    ownerUid: current.uid,
    createdAt: serverTimestamp(),
  };

  const result = await addDoc(collection(db, "students"), data);

  return {
    id: result.id,
    ...data,
  };
}

async function updateStudent(id, input) {
  const current = verifiedUser();

  if (!id) {
    throw new Error("Student record ID is missing.");
  }

  const data = validateStudent(input);

  await updateDoc(doc(db, "students", id), data);

  return {
    id,
    ...data,
    ownerUid: current.uid,
  };
}

async function deleteStudent(id) {
  verifiedUser();

  if (!id) {
    throw new Error("Student record ID is missing.");
  }

  await deleteDoc(doc(db, "students", id));
}

async function getStudents() {
  const current = verifiedUser();

  const recordsQuery = query(
    collection(db, "students"),
    where("ownerUid", "==", current.uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(recordsQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

const average = (rows, key) =>
  rows.length
    ? rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) /
      rows.length
    : null;

const percent = (value) =>
  value == null ? "—" : `${value.toFixed(1)}%`;

function formatAIText(text) {
  const parts = String(text ?? "").split(
    /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  );

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**") &&
      part.length > 4
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (
      part.startsWith("*") &&
      part.endsWith("*") &&
      part.length > 2
    ) {
      return (
        <em key={index}>
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

function renderAIInsights(text) {
  if (!text) return null;

  const lines = String(text)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (!currentList.length) return;

    elements.push(
      <ul
        className="em-ai-list"
        key={`list-${elements.length}`}
      >
        {currentList.map((item, index) => (
          <li key={index}>
            {formatAIText(item)}
          </li>
        ))}
      </ul>
    );

    currentList = [];
  };

  lines.forEach((line, index) => {
    if (/^[-*_]{3,}$/.test(line)) {
      flushList();
      return;
    }

    const headingMatch = line.match(/^#{1,6}\s*(.+)$/);

    if (headingMatch) {
      flushList();

      elements.push(
        <h3
          className="em-ai-section-title"
          key={`heading-${index}`}
        >
          {formatAIText(headingMatch[1])}
        </h3>
      );

      return;
    }

    const numberedHeading = line.match(
      /^\d+\.\s+(.+)$/
    );

    if (
      numberedHeading &&
      !numberedHeading[1].includes(":")
    ) {
      flushList();

      elements.push(
        <h3
          className="em-ai-section-title"
          key={`numbered-${index}`}
        >
          {formatAIText(numberedHeading[1])}
        </h3>
      );

      return;
    }

    const bulletMatch = line.match(
      /^[-*•]\s+(.+)$/
    );

    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
      return;
    }

    flushList();

    elements.push(
      <p
        className="em-ai-paragraph"
        key={`paragraph-${index}`}
      >
        {formatAIText(line)}
      </p>
    );
  });

  flushList();

  return elements;
}

const pageInfo = {
  overview: [
    "Dashboard Overview",
    "Your academic data in one workspace.",
  ],

  students: [
    "Student Management",
    "Add, edit, search and manage student records.",
  ],

  attendance: [
    "Attendance Analytics",
    "Review attendance levels using saved records.",
  ],

  performance: [
    "Performance Analytics",
    "Review recorded academic performance.",
  ],

  insights: [
    "AI Insights",
    "AI analysis based on your saved student data.",
  ],

  reports: [
    "Reports & Export",
    "Export your student records to a CSV report.",
  ],

  settings: [
    "Settings",
    "Manage your profile, security and workspace preferences.",
  ],
};

export default function Dashboard({ user }) {
  const [page, setPage] = useState("overview");

  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");

  const [reportFilter, setReportFilter] = useState("all");

  // SETTINGS
  const [settingsName, setSettingsName] = useState(
    user?.displayName || auth.currentUser?.displayName || ""
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(() => {
    return (
      localStorage.getItem("edumind_email_notifications") !== "false"
    );
  });

  const [riskAlerts, setRiskAlerts] = useState(() => {
    return localStorage.getItem("edumind_risk_alerts") !== "false";
  });

  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    const id = "edumind-dashboard-styles";

    let element = document.getElementById(id);
    const created = !element;

    if (!element) {
      element = document.createElement("style");
      element.id = id;
      document.head.appendChild(element);
    }

    element.textContent = styles;

    return () => {
      if (created) {
        element.remove();
      }
    };
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (currentUser?.displayName) {
      setSettingsName(currentUser.displayName);
    }
  }, [user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setStudents(await getStudents());
    } catch (err) {
      console.error("Unable to load student records:", err);
      setError(
        err.message || "Unable to load student records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter(
      (student) =>
        !term ||
        `${student.name} ${student.className}`
          .toLowerCase()
          .includes(term)
    );
  }, [students, search]);

  const avgAttendance = average(students, "attendance");
  const avgPerformance = average(students, "performance");

  const atRisk = students.filter(
    (student) =>
      Number(student.attendance) < 75 ||
      Number(student.performance) < 40
  );

  const onTrack = students.filter(
    (student) =>
      Number(student.performance) >= 80 &&
      Number(student.attendance) >= 75
  );

  function navigate(nextPage) {
    setPage(nextPage);
    setError("");
    setNotice("");
  }

  function changeForm(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEdit(student) {
    setEditingId(student.id);

    setForm({
      name: student.name || "",
      className: student.className || "",
      attendance: String(student.attendance ?? ""),
      performance: String(student.performance ?? ""),
    });

    setPage("students");
    setError("");
    setNotice("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function saveStudent(event) {
    event.preventDefault();

    setError("");
    setNotice("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        attendance: Number(form.attendance),
        performance: Number(form.performance),
      };

      if (editingId) {
        await updateStudent(editingId, payload);
      } else {
        await addStudent(payload);
      }

      setNotice(
        editingId
          ? "Student record updated successfully."
          : "Student saved successfully to Firebase Firestore."
      );

      setEditingId(null);
      setForm(EMPTY_FORM);

      await refresh();
    } catch (err) {
      console.error("Unable to save student:", err);

      setError(
        err.message || "Unable to save student."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeStudent(student) {
    const confirmed = window.confirm(
      `Delete ${student.name}'s record? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await deleteStudent(student.id);

      setNotice(
        `${student.name}'s record was deleted.`
      );

      if (editingId === student.id) {
        cancelEdit();
      }

      await refresh();
    } catch (err) {
      console.error("Unable to delete student:", err);

      setError(
        err.message || "Unable to delete student."
      );
    }
  }

  async function generateInsights() {
    setAiError("");
    setAiResult("");

    if (!students.length) {
      setAiError(
        "Add at least one student record before generating insights."
      );
      return;
    }

    const current = auth.currentUser;

    if (!current) {
      setAiError(
        "Your session has expired. Please sign in again."
      );
      return;
    }

    setAiLoading(true);

    try {
      const token = await current.getIdToken();

      const baseUrl = (
        import.meta.env.VITE_API_BASE_URL || ""
      ).replace(/\/$/, "");

      const response = await fetch(
        `${baseUrl}/api/ai-insights`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            students: students.map(
              ({
                name,
                className,
                attendance,
                performance,
              }) => ({
                name,
                className,
                attendance,
                performance,
              })
            ),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            `AI service failed (${response.status}).`
        );
      }

      if (!data.insights) {
        throw new Error(
          "AI service returned an empty response."
        );
      }

      setAiResult(
        typeof data.insights === "string"
          ? data.insights
          : JSON.stringify(data.insights, null, 2)
      );
    } catch (err) {
      console.error(
        "AI insight generation failed:",
        err
      );

      setAiError(
        `${err.message} Check that your AI backend is running and VITE_API_BASE_URL is configured correctly.`
      );
    } finally {
      setAiLoading(false);
    }
  }

  function exportCsv() {
    const records =
      reportFilter === "risk"
        ? filtered.filter(
            (s) =>
              Number(s.attendance) < 75 ||
              Number(s.performance) < 40
          )
        : reportFilter === "strong"
        ? filtered.filter(
            (s) =>
              Number(s.attendance) >= 75 &&
              Number(s.performance) >= 80
          )
        : filtered;

    if (!records.length) {
      setError(
        "There are no records to export for this selection."
      );
      return;
    }

    const headers = [
      "Student name",
      "Class/Course",
      "Attendance (%)",
      "Performance (%)",
      "Status",
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = records.map((student) => [
      student.name,
      student.className,
      student.attendance,
      student.performance,
      Number(student.attendance) < 75 ||
      Number(student.performance) < 40
        ? "Needs support"
        : "On track",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map(escapeCsv).join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `edumind-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    setNotice(
      `CSV report exported successfully (${records.length} records).`
    );

    setError("");
  }

  // SETTINGS FUNCTIONS

  async function saveProfileSettings() {
    setError("");
    setNotice("");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(
        "Your Firebase session has expired. Please sign in again."
      );
      return;
    }

    const name = settingsName.trim();

    if (name.length < 2) {
      setError(
        "Display name must contain at least 2 characters."
      );
      return;
    }

    setSettingsSaving(true);

    try {
      await updateProfile(currentUser, {
        displayName: name,
      });

      setSettingsName(name);

      setNotice(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile update failed:",
        err
      );

      setError(
        err.message ||
          "Unable to update your profile."
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function resendVerificationEmail() {
    setError("");
    setNotice("");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(
        "Your Firebase session has expired. Please sign in again."
      );
      return;
    }

    if (currentUser.emailVerified) {
      setNotice(
        "Your email is already verified."
      );
      return;
    }

    setSettingsSaving(true);

    try {
      await sendEmailVerification(currentUser);

      setNotice(
        "Verification email sent. Please check your inbox and spam folder."
      );
    } catch (err) {
      console.error(
        "Verification email failed:",
        err
      );

      setError(
        err.message ||
          "Unable to send verification email."
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function changePassword() {
    setError("");
    setNotice("");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(
        "Your Firebase session has expired. Please sign in again."
      );
      return;
    }

    if (!newPassword) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirmation do not match."
      );
      return;
    }

    setSettingsSaving(true);

    try {
      await updatePassword(
        currentUser,
        newPassword
      );

      setNewPassword("");
      setConfirmPassword("");

      setNotice(
        "Password changed successfully."
      );
    } catch (err) {
      console.error(
        "Password change failed:",
        err
      );

      if (
        err.code ===
        "auth/requires-recent-login"
      ) {
        setError(
          "For security, please sign out and sign in again before changing your password."
        );
      } else {
        setError(
          err.message ||
            "Unable to change your password."
        );
      }
    } finally {
      setSettingsSaving(false);
    }
  }

  function toggleEmailNotifications(enabled) {
    setEmailNotifications(enabled);

    localStorage.setItem(
      "edumind_email_notifications",
      String(enabled)
    );

    setNotice(
      enabled
        ? "Email notification preference enabled."
        : "Email notification preference disabled."
    );
  }

  function toggleRiskAlerts(enabled) {
    setRiskAlerts(enabled);

    localStorage.setItem(
      "edumind_risk_alerts",
      String(enabled)
    );

    setNotice(
      enabled
        ? "Student risk-alert highlighting enabled."
        : "Student risk-alert highlighting disabled."
    );
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (err) {
      setError(
        err.message || "Unable to sign out."
      );
    }
  }

  const currentUser = auth.currentUser;

  const displayName =
    currentUser?.displayName ||
    settingsName ||
    user?.displayName ||
    "Student";

  const userEmail =
    currentUser?.email ||
    user?.email ||
    "Signed-in account";

  const avatarLetter = (
    displayName ||
    userEmail ||
    "S"
  )
    .charAt(0)
    .toUpperCase();

  const title =
    pageInfo[page] ||
    pageInfo.overview;

  return (
    <div className="em-dashboard">

      <aside className="em-sidebar">

        <div className="em-brand">

          <span className="em-logo">
            E
          </span>

          <div>
            <b>
              EduMind <em>AI</em>
            </b>

            <small>
              SMART EDUCATION ANALYTICS
            </small>
          </div>

        </div>

        <div className="em-label">
          WORKSPACE
        </div>

        <nav
          className="em-nav"
          aria-label="Dashboard navigation"
        >

          {NAV.map(
            ([id, icon, label]) => (
              <button
                key={id}
                type="button"
                className={
                  page === id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigate(id)
                }
              >

                <span className="em-icon">
                  {icon}
                </span>

                <span className="em-text">
                  {label}
                </span>

                {id === "insights" && (
                  <span className="em-pill">
                    AI
                  </span>
                )}

              </button>
            )
          )}

        </nav>

        <div className="em-account">

          <div className="em-profile">

            <div className="em-avatar">
              {avatarLetter}
            </div>

            <div>

              <b>
                {displayName}
              </b>

              <small>
                {userEmail}
              </small>

            </div>

          </div>

          <button
            className="em-logout"
            type="button"
            onClick={logout}
          >
            ↪{" "}
            <span className="em-logout-text">
              Sign out
            </span>
          </button>

        </div>

      </aside>

      <main className="em-main">

        <header className="em-topbar">

          <div>

            <span className="em-kicker">
              EDUMIND AI / WORKSPACE
            </span>

            <h1>
              {title[0]}
            </h1>

          </div>

          <label className="em-search">

            <span>⌕</span>

            <input
              type="search"
              placeholder="Search students or classes..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              aria-label="Search students and classes"
            />

          </label>

        </header>

        <div className="em-content">

          <div className="em-welcome">

            <p>
              {title[1]}
            </p>

            <span className="em-date">
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              )}
            </span>

          </div>

          {error && (
            <div
              className="em-alert em-error"
              role="alert"
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>
            </div>
          )}

          {notice && (
            <div
              className="em-alert em-success"
              role="status"
            >
              <span>{notice}</span>

              <button
                type="button"
                onClick={() =>
                  setNotice("")
                }
              >
                ×
              </button>
            </div>
          )}

          {/* OVERVIEW */}

          {page === "overview" && (
            <>
              <section className="em-stats">

                <Stat
                  icon="♙"
                  label="Total students"
                  value={
                    loading
                      ? "…"
                      : students.length
                  }
                  detail="Records in your account"
                />

                <Stat
                  icon="▦"
                  label="Average attendance"
                  value={
                    loading
                      ? "…"
                      : percent(
                          avgAttendance
                        )
                  }
                  detail="Across saved records"
                  tone="mint"
                />

                <Stat
                  icon="▥"
                  label="Average performance"
                  value={
                    loading
                      ? "…"
                      : percent(
                          avgPerformance
                        )
                  }
                  detail="Recorded score average"
                  tone="rose"
                />

                <Stat
                  icon="⚑"
                  label="Need attention"
                  value={
                    loading
                      ? "…"
                      : atRisk.length
                  }
                  detail="Attendance below 75% or score below 40%"
                  tone="amber"
                />

              </section>

              <section className="em-grid">

                <div className="em-panel">

                  <PanelTitle
                    title="Recent student records"
                    subtitle="Latest records from Firestore"
                  />

                  <StudentTable
                    students={filtered.slice(
                      0,
                      5
                    )}
                    loading={loading}
                    onEdit={startEdit}
                    onDelete={
                      removeStudent
                    }
                    compact
                  />

                  <button
                    className="em-button em-primary"
                    type="button"
                    onClick={() =>
                      navigate(
                        "students"
                      )
                    }
                  >
                    Manage students →
                  </button>

                </div>

                <div className="em-panel">

                  <PanelTitle
                    title="At-a-glance insights"
                    subtitle="Calculated from saved student records"
                  />

                  <div className="em-insight">

                    <span className="em-dot" />

                    <div>

                      <b>
                        {onTrack.length}{" "}
                        students on track
                      </b>

                      <p>
                        Performance at least
                        80% and attendance at
                        least 75%.
                      </p>

                    </div>

                  </div>

                  <div className="em-insight">

                    <span className="em-dot amber" />

                    <div>

                      <b>
                        {atRisk.length}{" "}
                        students may need
                        support
                      </b>

                      <p>
                        Attendance below 75%
                        or performance below
                        40%.
                      </p>

                    </div>

                  </div>

                  <div className="em-callout">

                    <b>
                      Want deeper analysis?
                    </b>

                    <p>
                      Generate AI Insights
                      using your saved student
                      records.
                    </p>

                    <button
                      className="em-button em-secondary"
                      type="button"
                      onClick={() =>
                        navigate(
                          "insights"
                        )
                      }
                    >
                      Open AI Insights
                    </button>

                  </div>

                </div>

              </section>
            </>
          )}

          {/* STUDENTS */}

          {page === "students" && (
            <section className="em-grid">

              <div className="em-panel">

                <PanelTitle
                  title={
                    editingId
                      ? "Edit student"
                      : "Add a student"
                  }
                  subtitle="Student records are saved to Firebase."
                />

                <form
                  className="em-form"
                  onSubmit={
                    saveStudent
                  }
                >

                  <label>
                    Student full name

                    <input
                      name="name"
                      value={form.name}
                      onChange={
                        changeForm
                      }
                      maxLength={100}
                      required
                      placeholder="Student name"
                    />
                  </label>

                  <label>
                    Class / course

                    <input
                      name="className"
                      value={
                        form.className
                      }
                      onChange={
                        changeForm
                      }
                      maxLength={100}
                      required
                      placeholder="e.g. B.Tech CSE"
                    />
                  </label>

                  <label>
                    Attendance (%)

                    <input
                      name="attendance"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={
                        form.attendance
                      }
                      onChange={
                        changeForm
                      }
                      required
                      placeholder="0–100"
                    />
                  </label>

                  <label>
                    Performance (%)

                    <input
                      name="performance"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={
                        form.performance
                      }
                      onChange={
                        changeForm
                      }
                      required
                      placeholder="0–100"
                    />
                  </label>

                  <div className="em-actions">

                    <button
                      className="em-button em-primary"
                      type="submit"
                      disabled={
                        saving
                      }
                    >
                      {saving
                        ? "Saving…"
                        : editingId
                        ? "Save changes"
                        : "Add student"}
                    </button>

                    {editingId && (
                      <button
                        className="em-button em-ghost"
                        type="button"
                        onClick={
                          cancelEdit
                        }
                      >
                        Cancel
                      </button>
                    )}

                  </div>

                </form>

                <p className="em-note">
                  Records are associated
                  with your signed-in
                  Firebase account. Keep
                  Firestore security rules
                  enabled.
                </p>

              </div>

              <div className="em-panel">

                <PanelTitle
                  title="Student directory"
                  subtitle={`${filtered.length} matching record${
                    filtered.length === 1
                      ? ""
                      : "s"
                  }`}
                />

                <StudentTable
                  students={filtered}
                  loading={loading}
                  onEdit={startEdit}
                  onDelete={
                    removeStudent
                  }
                />

              </div>

            </section>
          )}

          {/* ATTENDANCE */}

          {page === "attendance" && (
            <>
              <section className="em-stats three">

                <Stat
                  icon="▦"
                  label="Average attendance"
                  value={
                    loading
                      ? "…"
                      : percent(
                          avgAttendance
                        )
                  }
                  detail="Mean of recorded percentages"
                  tone="mint"
                />

                <Stat
                  icon="↓"
                  label="Below 75%"
                  value={
                    loading
                      ? "…"
                      : students.filter(
                          (s) =>
                            Number(
                              s.attendance
                            ) < 75
                        ).length
                  }
                  detail="Review attendance support"
                  tone="amber"
                />

                <Stat
                  icon="✓"
                  label="At least 90%"
                  value={
                    loading
                      ? "…"
                      : students.filter(
                          (s) =>
                            Number(
                              s.attendance
                            ) >= 90
                        ).length
                  }
                  detail="Strong attendance records"
                />

              </section>

              <div className="em-panel">

                <PanelTitle
                  title="Attendance register"
                  subtitle="These are overall saved percentages, not daily roll-call events."
                />

                <StudentTable
                  students={filtered}
                  loading={loading}
                  onEdit={startEdit}
                  onDelete={
                    removeStudent
                  }
                  only="attendance"
                />

              </div>
            </>
          )}

          {/* PERFORMANCE */}

          {page === "performance" && (
            <>
              <section className="em-stats three">

                <Stat
                  icon="▥"
                  label="Average performance"
                  value={
                    loading
                      ? "…"
                      : percent(
                          avgPerformance
                        )
                  }
                  detail="Mean recorded score"
                  tone="rose"
                />

                <Stat
                  icon="↑"
                  label="80% and above"
                  value={
                    loading
                      ? "…"
                      : students.filter(
                          (s) =>
                            Number(
                              s.performance
                            ) >= 80
                        ).length
                  }
                  detail="High-performing records"
                  tone="mint"
                />

                <Stat
                  icon="!"
                  label="Below 40%"
                  value={
                    loading
                      ? "…"
                      : students.filter(
                          (s) =>
                            Number(
                              s.performance
                            ) < 40
                        ).length
                  }
                  detail="May benefit from support"
                  tone="amber"
                />

              </section>

              <div className="em-panel">

                <PanelTitle
                  title="Performance register"
                  subtitle="Scores are entered values, not AI-generated grades or predictions."
                />

                <StudentTable
                  students={filtered}
                  loading={loading}
                  onEdit={startEdit}
                  onDelete={
                    removeStudent
                  }
                  only="performance"
                />

              </div>
            </>
          )}

          {/* AI INSIGHTS */}

          {page === "insights" && (
            <div className="em-panel em-ai">

              <div className="em-ai-head">

                <div>

                  <h2>
                    ✦ AI learning insights
                  </h2>

                  <p>
                    Generate analysis from
                    the student records saved
                    in your account.
                  </p>

                </div>

                <button
                  className="em-button em-primary"
                  type="button"
                  onClick={
                    generateInsights
                  }
                  disabled={
                    aiLoading ||
                    loading
                  }
                >
                  {aiLoading
                    ? "Analyzing…"
                    : "Generate AI analysis"}
                </button>

              </div>

              <div className="em-ai-warning">
                AI observations may be
                imperfect. Use them as
                decision support, not as a
                substitute for educator
                judgement.
              </div>

              {aiError && (
                <div
                  className="em-alert em-error"
                  role="alert"
                >
                  {aiError}
                </div>
              )}

              {aiLoading && (
                <div className="em-empty">
                  Analyzing saved student
                  data…
                </div>
              )}

              {aiResult && (
                <div className="em-ai-result">
                  <div className="em-ai-result-header">
                    <div>
                      <span className="em-ai-result-label">
                        AI ANALYSIS
                      </span>

                      <h3>
                        Student Learning Insights
                      </h3>
                    </div>

                    <span className="em-ai-live">
                      ● Generated
                    </span>
                  </div>

                  <div className="em-ai-content">
                    {renderAIInsights(aiResult)}
                  </div>
                </div>
              )}

              <div className="em-metrics">

                <span>
                  <b>
                    {students.length}
                  </b>
                  students
                </span>

                <span>
                  <b>
                    {percent(
                      avgAttendance
                    )}
                  </b>
                  average attendance
                </span>

                <span>
                  <b>
                    {percent(
                      avgPerformance
                    )}
                  </b>
                  average performance
                </span>

                <span>
                  <b>
                    {atRisk.length}
                  </b>
                  need attention
                </span>

              </div>

              {!students.length && (
                <p className="em-note">
                  Add student records first
                  to enable analysis.
                </p>
              )}

            </div>
          )}

          {/* REPORTS */}

          {page === "reports" && (
            <div className="em-panel">

              <PanelTitle
                title="Student reports"
                subtitle="Export a CSV file that opens in Excel, Google Sheets or LibreOffice."
              />

              <div className="em-report-grid">

                <div>
                  <span>
                    Total records
                  </span>

                  <b>
                    {students.length}
                  </b>
                </div>

                <div>
                  <span>
                    Average attendance
                  </span>

                  <b>
                    {percent(
                      avgAttendance
                    )}
                  </b>
                </div>

                <div>
                  <span>
                    Average performance
                  </span>

                  <b>
                    {percent(
                      avgPerformance
                    )}
                  </b>
                </div>

                <div>
                  <span>
                    Need attention
                  </span>

                  <b>
                    {atRisk.length}
                  </b>
                </div>

              </div>

              <label>
                Records to export

                <select
                  className="em-select"
                  value={
                    reportFilter
                  }
                  onChange={(event) =>
                    setReportFilter(
                      event.target.value
                    )
                  }
                >

                  <option value="all">
                    All matching records
                    (search applies)
                  </option>

                  <option value="risk">
                    Students needing support
                  </option>

                  <option value="strong">
                    Students on track
                  </option>

                </select>
              </label>

              <p className="em-note">
                The report includes
                student name, class/course,
                attendance, performance and
                support status. It does not
                add fictional records.
              </p>

              <button
                className="em-button em-primary"
                type="button"
                onClick={
                  exportCsv
                }
                disabled={loading}
              >
                Download CSV report ↓
              </button>

            </div>
          )}

          {/* SETTINGS */}

          {page === "settings" && (
            <section className="em-settings-grid">

              {/* PROFILE */}

              <div className="em-settings-card">

                <div className="em-settings-head">

                  <div className="em-settings-icon">
                    👤
                  </div>

                  <div>
                    <h2>
                      Profile
                    </h2>

                    <p>
                      Manage your EduMind AI
                      account information.
                    </p>
                  </div>

                </div>

                <div className="em-settings-form">

                  <label>
                    Display name

                    <input
                      type="text"
                      value={
                        settingsName
                      }
                      onChange={(event) =>
                        setSettingsName(
                          event.target.value
                        )
                      }
                      maxLength={100}
                      placeholder="Your name"
                    />
                  </label>

                  <label>
                    Email address

                    <input
                      type="email"
                      value={
                        userEmail
                      }
                      disabled
                      readOnly
                    />
                  </label>

                  <div className="em-verification-row">

                    <div
                      className={`em-verification-status ${
                        currentUser?.emailVerified
                          ? "verified"
                          : "unverified"
                      }`}
                    >

                      <span>
                        {currentUser?.emailVerified
                          ? "✓"
                          : "!"}
                      </span>

                      <span>
                        {currentUser?.emailVerified
                          ? "Email verified"
                          : "Email not verified"}
                      </span>

                    </div>

                    {!currentUser?.emailVerified && (
                      <button
                        className="em-button em-secondary"
                        type="button"
                        onClick={
                          resendVerificationEmail
                        }
                        disabled={
                          settingsSaving
                        }
                      >
                        Send verification email
                      </button>
                    )}

                  </div>

                  <button
                    className="em-button em-primary"
                    type="button"
                    onClick={
                      saveProfileSettings
                    }
                    disabled={
                      settingsSaving
                    }
                  >
                    {settingsSaving
                      ? "Saving…"
                      : "Save profile"}
                  </button>

                </div>

              </div>

              {/* SECURITY */}

              <div className="em-settings-card">

                <div className="em-settings-head">

                  <div className="em-settings-icon">
                    🔒
                  </div>

                  <div>
                    <h2>
                      Security
                    </h2>

                    <p>
                      Update your Firebase
                      Authentication password.
                    </p>
                  </div>

                </div>

                <div className="em-settings-form">

                  <label>
                    New password

                    <input
                      type="password"
                      value={
                        newPassword
                      }
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                    />
                  </label>

                  <label>
                    Confirm new password

                    <input
                      type="password"
                      value={
                        confirmPassword
                      }
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      minLength={8}
                      placeholder="Enter password again"
                      autoComplete="new-password"
                    />
                  </label>

                  <div className="em-security-note">
                    For account security, Firebase
                    may require you to sign in
                    again before allowing a
                    password change.
                  </div>

                  <button
                    className="em-button em-primary"
                    type="button"
                    onClick={
                      changePassword
                    }
                    disabled={
                      settingsSaving
                    }
                  >
                    {settingsSaving
                      ? "Updating…"
                      : "Change password"}
                  </button>

                </div>

              </div>

              {/* PREFERENCES */}

              <div className="em-settings-card">

                <div className="em-settings-head">

                  <div className="em-settings-icon">
                    ⚙
                  </div>

                  <div>
                    <h2>
                      Preferences
                    </h2>

                    <p>
                      Choose how EduMind AI
                      handles your local
                      dashboard preferences.
                    </p>
                  </div>

                </div>

                <div className="em-setting-options">

                  <div className="em-setting-toggle">

                    <div className="em-setting-toggle-text">

                      <b>
                        Email notification preference
                      </b>

                      <span>
                        Save your preference for
                        future notification features.
                      </span>

                    </div>

                    <label className="em-toggle">

                      <input
                        type="checkbox"
                        checked={
                          emailNotifications
                        }
                        onChange={(event) =>
                          toggleEmailNotifications(
                            event.target.checked
                          )
                        }
                      />

                      <span className="em-toggle-slider" />

                    </label>

                  </div>

                  <div className="em-setting-toggle">

                    <div className="em-setting-toggle-text">

                      <b>
                        Student risk alerts
                      </b>

                      <span>
                        Keep the dashboard's
                        student-support highlighting
                        preference enabled.
                      </span>

                    </div>

                    <label className="em-toggle">

                      <input
                        type="checkbox"
                        checked={
                          riskAlerts
                        }
                        onChange={(event) =>
                          toggleRiskAlerts(
                            event.target.checked
                          )
                        }
                      />

                      <span className="em-toggle-slider" />

                    </label>

                  </div>

                </div>

                <p className="em-note">
                  These preferences are stored
                  in this browser. They do not
                  create or send emails by
                  themselves.
                </p>

              </div>

              {/* ACCOUNT */}

              <div className="em-settings-card">

                <div className="em-settings-head">

                  <div className="em-settings-icon">
                    ☁
                  </div>

                  <div>
                    <h2>
                      Account & Data
                    </h2>

                    <p>
                      Information about your
                      EduMind AI data connection.
                    </p>
                  </div>

                </div>

                <div className="em-account-details">

                  <div>
                    <span>
                      Authentication
                    </span>

                    <b>
                      Firebase Authentication
                    </b>
                  </div>

                  <div>
                    <span>
                      Database
                    </span>

                    <b>
                      Cloud Firestore
                    </b>
                  </div>

                  <div>
                    <span>
                      Student records
                    </span>

                    <b>
                      {students.length}
                    </b>
                  </div>

                  <div>
                    <span>
                      Firebase UID
                    </span>

                    <b>
                      {currentUser?.uid ||
                        "Unavailable"}
                    </b>
                  </div>

                </div>

                <div className="em-settings-danger">

                  <button
                    className="em-button em-danger"
                    type="button"
                    onClick={
                      logout
                    }
                  >
                    Sign out of EduMind AI
                  </button>

                </div>

              </div>

              {/* SECURITY INFORMATION */}

              <div className="em-settings-card full">

                <div className="em-settings-head">

                  <div className="em-settings-icon">
                    ✓
                  </div>

                  <div>
                    <h2>
                      Data & Security
                    </h2>

                    <p>
                      EduMind AI uses your
                      authenticated Firebase
                      account to access your
                      student records.
                    </p>
                  </div>

                </div>

                <p className="em-note">
                  Your student records are
                  associated with your Firebase
                  account. The dashboard does not
                  intentionally expose records
                  belonging to another account.
                  Keep your Firebase security
                  rules enabled.
                </p>

              </div>

            </section>
          )}

          <footer className="em-footer">

            <span>
              EduMind AI · Smart Education
              Analytics
            </span>

            <span>
              Data shown from your Firebase
              records
            </span>

          </footer>

        </div>

      </main>

    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  detail,
  tone = "",
}) {
  return (
    <article
      className={`em-stat ${tone}`}
    >

      <div className="em-stat-icon">
        {icon}
      </div>

      <div className="em-stat-info">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {detail}
        </small>

      </div>

    </article>
  );
}

function PanelTitle({
  title,
  subtitle,
}) {
  return (
    <div className="em-panel-head">

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {subtitle}
        </p>

      </div>

    </div>
  );
}

function StudentTable({
  students,
  loading,
  onEdit,
  onDelete,
  compact = false,
  only = "all",
}) {
  if (loading) {
    return (
      <div className="em-empty">
        Loading student records…
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="em-empty">
        No student records found. Add a
        student or change your search.
      </div>
    );
  }

  return (
    <div className="em-table-wrap">

      <table className="em-table">

        <thead>

          <tr>

            <th>
              Student
            </th>

            <th>
              Class / course
            </th>

            {only !== "performance" && (
              <th>
                Attendance
              </th>
            )}

            {only !== "attendance" && (
              <th>
                Performance
              </th>
            )}

            {!compact && (
              <th>
                Status
              </th>
            )}

            <th>
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {students.map(
            (student) => {

              const risk =
                Number(
                  student.attendance
                ) < 75 ||
                Number(
                  student.performance
                ) < 40;

              return (
                <tr
                  key={student.id}
                >

                  <td>
                    <b>
                      {student.name}
                    </b>
                  </td>

                  <td>
                    {student.className}
                  </td>

                  {only !==
                    "performance" && (
                    <td>
                      <Meter
                        value={Number(
                          student.attendance
                        )}
                      />
                    </td>
                  )}

                  {only !==
                    "attendance" && (
                    <td>
                      <Meter
                        value={Number(
                          student.performance
                        )}
                        rose
                      />
                    </td>
                  )}

                  {!compact && (
                    <td>

                      <span
                        className={`em-status ${
                          risk
                            ? "risk"
                            : "good"
                        }`}
                      >
                        {risk
                          ? "Needs support"
                          : "On track"}
                      </span>

                    </td>
                  )}

                  <td>

                    <div className="em-actions-row">

                      <button
                        className="em-link"
                        type="button"
                        onClick={() =>
                          onEdit(
                            student
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="em-link em-delete"
                        type="button"
                        onClick={() =>
                          onDelete(
                            student
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>
              );
            }
          )}

        </tbody>

      </table>

    </div>
  );
}

function Meter({
  value,
  rose = false,
}) {
  const safeValue =
    Number.isFinite(value)
      ? Math.max(
          0,
          Math.min(100, value)
        )
      : 0;

  return (
    <div className="em-meter">

      <span>
        {Number.isFinite(value)
          ? `${value}%`
          : "—"}
      </span>

      <div className="em-track">

        <i
          className={
            rose ? "rose" : ""
          }
          style={{
            width: `${safeValue}%`,
          }}
        />

      </div>

    </div>
  );
}