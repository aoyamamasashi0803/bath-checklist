import React, { useState, useEffect } from 'react';

const FamilyBathCheckList = () => {
  // 家族メンバー
  const familyMembers = ['お父さん', 'お母さん', 'カイ', 'ササ'];
  
  // 現在の日付を取得する関数
  const getCurrentDate = () => {
    const now = new Date();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[now.getDay()];
    return {
      date: `${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日（${weekday}）`,
      weekday: weekday
    };
  };
  
  // ローカルストレージからスケジュールを取得する関数
  const getStoredSchedule = () => {
    const storedSchedule = localStorage.getItem('bathDutySchedule');
    if (storedSchedule) {
      return JSON.parse(storedSchedule);
    }
    return {
      '月': 'カイ',
      '火': 'ササ',
      '水': 'ササ',
      '木': 'ササ',
      '金': 'カイ',
      '土': 'カイ',
      '日': 'ササ'
    };
  };
  
  // ローカルストレージから履歴を取得する関数
  const getStoredHistory = () => {
    const storedHistory = localStorage.getItem('bathCheckHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  };
  
  // 状態変数の初期化
  const [dutySchedule, setDutySchedule] = useState(getStoredSchedule());
  const [showSettings, setShowSettings] = useState(false);
  const [showDutySettings, setShowDutySettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(getStoredHistory());
  
  // 曜日別風呂掃除当番
  const getBathCleaningPerson = (weekday) => {
    return dutySchedule[weekday] || '';
  };
  
  // メンバーごとの色を設定
  const memberColors = {
    'お父さん': { bg: '#ECF2FF', text: '#1E3A8A', border: '#93C5FD' },
    'お母さん': { bg: '#FEE2E2', text: '#9B1C1C', border: '#F87171' },
    'カイ': { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' },
    'ササ': { bg: '#FFEDD5', text: '#7C2D12', border: '#FB923C' }
  };
  
  // ローカルストレージからチェックリストを取得する関数
  const getStoredChecklist = () => {
    const storedChecklist = localStorage.getItem('bathChecklist');
    const today = getCurrentDate();
    
    // チェックリストがない、または日付が違う場合は新しいチェックリストを作成
    if (!storedChecklist) {
      return {
        date: today.date,
        weekday: today.weekday,
        checks: familyMembers.reduce((acc, member) => ({...acc, [member]: false}), {}),
        memo: ''
      };
    }
    
    const parsedChecklist = JSON.parse(storedChecklist);
    
    // 日付が違う場合は履歴に追加して新しいチェックリストを作成
    if (parsedChecklist.date !== today.date) {
      const history = getStoredHistory();
      history.push(parsedChecklist);
      localStorage.setItem('bathCheckHistory', JSON.stringify(history));
      
      return {
        date: today.date,
        weekday: today.weekday,
        checks: familyMembers.reduce((acc, member) => ({...acc, [member]: false}), {}),
        memo: ''
      };
    }
    
    // 曜日の情報が足りない場合は追加
    if (!parsedChecklist.weekday) {
      parsedChecklist.weekday = today.weekday;
    }
    
    // 新しいメモ形式に移行
    if (!parsedChecklist.memo && parsedChecklist.memos) {
      const allMemos = Object.values(parsedChecklist.memos).filter(memo => memo !== '');
      parsedChecklist.memo = allMemos.join(' / ');
      delete parsedChecklist.memos;
    } else if (!parsedChecklist.memo) {
      parsedChecklist.memo = '';
    }
    
    return parsedChecklist;
  };
  
  const [checklist, setChecklist] = useState(getStoredChecklist());
  
  // スケジュールの変更を保存
  useEffect(() => {
    localStorage.setItem('bathDutySchedule', JSON.stringify(dutySchedule));
  }, [dutySchedule]);
  
  // チェックリストの変更を保存
  useEffect(() => {
    localStorage.setItem('bathChecklist', JSON.stringify(checklist));
  }, [checklist]);
  
  // 履歴の変更を保存
  useEffect(() => {
    localStorage.setItem('bathCheckHistory', JSON.stringify(history));
  }, [history]);
  
  // 午前3時にチェックリストをリセット
  useEffect(() => {
    const checkDate = () => {
      const today = getCurrentDate();
      if (checklist.date !== today.date) {
        // 古いチェックリストを履歴に追加
        const newHistory = [...history, checklist];
        setHistory(newHistory);
        
        // 新しいチェックリストを作成
        setChecklist({
          date: today.date,
          weekday: today.weekday,
          checks: familyMembers.reduce((acc, member) => ({...acc, [member]: false}), {}),
          memo: ''
        });
      }
    };
    
    // 一日一回、午前3時にチェック
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    tomorrow.setHours(3, 0, 0, 0); // 午前3時に設定
    const timeUntil3AM = tomorrow - now;
    
    const resetTimeout = setTimeout(checkDate, timeUntil3AM);
    
    return () => clearTimeout(resetTimeout);
  }, [checklist, history]);
  
  // チェックボックスの状態を変更する関数
  const toggleCheck = (member) => {
    setChecklist({
      ...checklist,
      checks: {
        ...checklist.checks,
        [member]: !checklist.checks[member]
      }
    });
  };
  
  // 当番を変更する関数
  const changeDuty = (weekday, person) => {
    setDutySchedule({
      ...dutySchedule,
      [weekday]: person
    });
  };
  
  // メモを更新する関数
  const updateMemo = (text) => {
    setChecklist({
      ...checklist,
      memo: text
    });
  };
  
  // 全員がチェックされているか確認
  const allChecked = Object.values(checklist.checks).every(checked => checked);
  
  // チェック済みの人数をカウント
  const checkedCount = Object.values(checklist.checks).filter(checked => checked).length;
  
  // 履歴を削除する関数
  const clearHistory = () => {
    if (window.confirm('履歴をすべて削除してもよろしいですか？')) {
      setHistory([]);
      setShowSettings(false);
    }
  };
  
  return (
    <div className="p-6 min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #f6f9fc 0%, #e9f1f7 100%)' }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.05)' }}>
        {/* ヘッダー部分 */}
        <div className="bg-indigo-700 text-white px-6 py-5 relative">
          <h1 className="text-3xl font-serif tracking-wider text-center mb-2" style={{ fontFamily: 'Georgia, serif' }}>Bath Checker</h1>
          <p className="text-indigo-100 text-center mb-2">{checklist.date}</p>
          
          {/* 設定アイコン */}
          <div className="absolute top-5 right-5">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:text-indigo-200 focus:outline-none transition-colors"
              aria-label="設定"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* 設定メニュー */}
            {showSettings && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-100">
                <button
                  onClick={() => {
                    setShowDutySettings(true);
                    setShowSettings(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  掃除当番設定
                </button>
                <button
                  onClick={clearHistory}
                  className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  履歴をクリア
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {/* 風呂掃除当番表示 */}
          <div className="mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center">
              <div className="mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">今日の風呂掃除当番</h2>
                <p className="text-xl font-semibold" style={{ color: memberColors[getBathCleaningPerson(checklist.weekday)].text }}>
                  {getBathCleaningPerson(checklist.weekday)}
                </p>
              </div>
            </div>
          </div>
          
          {/* 入浴状況表示 */}
          <div className="mb-6">
            <div className={`p-4 rounded-xl shadow-md ${
              allChecked 
                ? 'bg-emerald-50 border border-emerald-200' 
                : checkedCount === familyMembers.length - 1 
                  ? 'bg-amber-50 border border-amber-200' 
                  : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                <div className="mr-3">
                  {allChecked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : checkedCount === familyMembers.length - 1 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="font-medium text-gray-800">
                  {allChecked 
                    ? '全員入浴済み！' 
                    : checkedCount === familyMembers.length - 1 
                      ? 'あなたが最後です、入浴後にお湯を抜いてください。' 
                      : 'まだ入浴していないメンバーがいます'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* 入浴チェックボタン */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-700 mb-3 pb-1 border-b border-gray-200">入浴チェック</h3>
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div key={member} className="transform transition-transform hover:scale-[1.01]">
                  <button
                    onClick={() => toggleCheck(member)}
                    className={`w-full p-4 rounded-xl flex items-center justify-between shadow-sm transition-all ${
                      checklist.checks[member] 
                        ? 'bg-emerald-50 border border-emerald-200' 
                        : 'bg-white border hover:border-gray-300'
                    }`}
                    style={{ 
                      borderColor: checklist.checks[member] ? '#6EE7B7' : memberColors[member].border,
                      backgroundColor: checklist.checks[member] ? '#ECFDF5' : memberColors[member].bg,
                    }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-10 rounded-full mr-3" 
                        style={{ backgroundColor: memberColors[member].border }}
                      ></div>
                      <span 
                        className="font-medium text-lg"
                        style={{ color: checklist.checks[member] ? '#065F46' : memberColors[member].text }}
                      >
                        {member}
                      </span>
                    </div>
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                      checklist.checks[member] 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white border border-gray-300'
                    }`}>
                      {checklist.checks[member] ? '✓' : ''}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* メモ欄 */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3 pb-1 border-b border-gray-200">メモ</h3>
            <div className="relative bg-white rounded-xl shadow-sm">
              <textarea
                placeholder="一言メモを記入..."
                value={checklist.memo || ''}
                onChange={(e) => updateMemo(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500 min-h-16"
                maxLength={200}
                rows={2}
              />
              {checklist.memo && (
                <button
                  onClick={() => updateMemo('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* 履歴ボタン */}
          <div className="pt-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-center w-full p-3 rounded-xl text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 transition-colors bg-white"
            >
              <span className="mr-2 font-medium">
                {showHistory ? '履歴を隠す' : '履歴を表示'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* 履歴表示 */}
          {showHistory && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h2 className="text-xl font-medium text-gray-800 mb-4">履歴</h2>
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-6">履歴はありません</p>
              ) : (
                <div className="space-y-4">
                  {[...history].reverse().map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <p className="font-medium text-gray-700 mb-2">{item.date}</p>
                      <div className="space-y-2">
                        {familyMembers.map((member) => (
                          <div key={member} className="flex items-center">
                            <div 
                              className="w-1 h-6 rounded-full mr-2"
                              style={{ backgroundColor: memberColors[member].border }}
                            ></div>
                            <div className={`h-4 w-4 mr-2 rounded-full ${item.checks[member] ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            <span className="text-gray-800">{member}: {item.checks[member] ? '入浴済み' : '未入浴'}</span>
                          </div>
                        ))}
                      </div>
                      {item.memo && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border-l-2 border-indigo-300">
                          「{item.memo}」
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 掃除当番設定モーダル */}
        {showDutySettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-gray-800">風呂掃除当番設定</h3>
                <button
                  onClick={() => setShowDutySettings(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {['月', '火', '水', '木', '金', '土', '日'].map(weekday => (
                  <div key={weekday} className="flex items-center">
                    <div className="w-16 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mr-4">
                      <span className="font-medium text-indigo-700">{weekday}曜日</span>
                    </div>
                    <div className="flex-1">
                      <select
                        value={dutySchedule[weekday]}
                        onChange={(e) => changeDuty(weekday, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        style={{ 
                          backgroundColor: memberColors[dutySchedule[weekday]].bg,
                          color: memberColors[dutySchedule[weekday]].text,
                          borderColor: memberColors[dutySchedule[weekday]].border
                        }}
                      >
                        {familyMembers.map(member => (
                          <option key={member} value={member}>{member}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowDutySettings(false)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                >
                  完了
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-gray-500">© 2025 Family Bath Checker</p>
    </div>
  );
};

export default FamilyBathCheckList;