(function(){
  function onReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }

  onReady(function(){
    var form = document.getElementById('ige-newsletter');
    if(!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1'; // evita agregar dos listeners

    var btn = form.querySelector('button[type="submit"]');
    var spinner = btn && btn.querySelector('[data-ige-spinner]');
    var msg = form.parentElement.querySelector('[data-ige-msg]') || form.querySelector('[data-ige-msg]');
    function setLoading(v){
      if(!btn) return;
      btn.disabled = v;
      btn.classList.toggle('opacity-60', v);
      btn.classList.toggle('cursor-not-allowed', v);
      if(spinner) spinner.classList.toggle('hidden', !v);
      var t = btn.querySelector('[data-ige-btntext]');
      if(t) t.textContent = v ? 'Enviando…' : 'Enviar';
    }

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      if(msg) msg.textContent = '';
      var email = (form.querySelector('input[type="email"]')?.value || '').trim();
      if(!email){ if(msg) msg.textContent='Escribe tu email.'; return; }

      setLoading(true);
      try{
        var body = new URLSearchParams();
        body.set('action','ige_newsletter_subscribe');
        body.set('nonce', window.IGE_CFG?.nonce || '');
        body.set('email', email);

        var res = await fetch(window.IGE_CFG?.ajax || '/wp-admin/admin-ajax.php', {
          method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
          body: body.toString()
        });

        var data; try { data = await res.json(); }
        catch(_){ throw new Error(await res.text() || 'Respuesta inválida'); }

        if(!data || data.success === false){
          throw new Error(data?.data?.message || 'No se pudo guardar');
        }
        if(msg) msg.textContent = data.data?.duplicate ? '' : '¡Listo! Te agregamos a la lista.';
        form.reset();
      }catch(err){
        if(msg) msg.textContent = (''+err.message).slice(0,200) || 'No se pudo guardar';
        console.error(err);
      }finally{
        setLoading(false);
      }
    });
  });
})();