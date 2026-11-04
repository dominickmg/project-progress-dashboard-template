// Apply the saved appearance before the page paints; storage may be disabled.
(()=>{
 let theme;
 try{theme=localStorage.getItem('project-dashboard-theme')}catch{}
 if(theme!=='light'&&theme!=='dark')theme=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
 document.documentElement.dataset.theme=theme;
 document.documentElement.style.colorScheme=theme;
})();

