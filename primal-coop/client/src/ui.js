const $ = id => document.getElementById(id);

export class GameUI {
  constructor({ onJoin, onResume, onLeave }) {
    this.lastRoster = '';
    this.latency = null;
    this.fps = 0;
    this.toastTimer = null;
    const urlRoom = new URLSearchParams(location.search).get('room');
    if (urlRoom && /^[A-Za-z0-9-]{3,12}$/.test(urlRoom)) $('room').value = urlRoom.toUpperCase();
    $('join-form').addEventListener('submit', event => {
      event.preventDefault();
      onJoin($('name').value.trim(), $('room').value.trim().toUpperCase());
    });
    $('resume-button').addEventListener('click', onResume);
    $('leave-button').addEventListener('click', onLeave);
    $('copy-link').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        this.toast('Room link copied.');
      } catch {
        this.toast('Copy the page address to share this room.');
      }
    });
  }
  joining() { $('join-button').disabled = true; $('join-error').hidden = true; }
  error(message) {
    $('join-button').disabled = false;
    $('join-error').textContent = message;
    $('join-error').hidden = false;
  }
  joined(room) {
    $('lobby').hidden = true;
    $('lobby-footer').hidden = true;
    $('hud').hidden = false;
    $('room-label').textContent = room;
    $('room').value = room;
    const url = new URL(location.href);
    url.searchParams.set('room', room);
    history.replaceState(null, '', url);
    this.connection(true);
    this.toast('You made it to the clearing.');
  }
  lobby() {
    $('lobby').hidden = false;
    $('lobby-footer').hidden = false;
    $('hud').hidden = true;
    $('pause').hidden = true;
    $('join-button').disabled = false;
    $('join-error').hidden = true;
    this.lastRoster = '';
  }
  paused(paused) { $('pause').hidden = !paused; $('crosshair').hidden = paused; }
  connection(connected) {
    $('connection-status').textContent = connected ? 'CONNECTED' : 'RECONNECTING';
    document.querySelector('.session-strip').classList.toggle('offline', !connected);
    $('pause-message').textContent = connected
      ? 'Your hunter is standing still. Click below to keep exploring.'
      : 'The connection dropped. We’re trying to rejoin your room.';
  }
  snapshot(snapshot, selfId) {
    const signature = snapshot.players.map(player => `${player.id}:${player.name}`).join('|');
    if (signature === this.lastRoster) return;
    this.lastRoster = signature;
    $('player-count').textContent = `${snapshot.players.length} / 2`;
    $('waiting-note').hidden = snapshot.players.length === 2;
    $('roster').replaceChildren(...snapshot.players.map(player => {
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'player-dot';
      dot.style.background = `#${player.color.toString(16).padStart(6, '0')}`;
      const name = document.createElement('span');
      name.textContent = player.name;
      li.append(dot, name);
      if (player.id === selfId) {
        const tag = document.createElement('span');
        tag.className = 'you-tag';
        tag.textContent = 'YOU';
        li.append(tag);
      }
      return li;
    }));
  }
  metrics(fps = this.fps, latency = this.latency) {
    this.fps = fps;
    this.latency = latency;
    $('metrics').textContent = `${latency === null ? '—' : latency} ms  /  ${fps} fps`;
  }
  movement(state, sprinting) { $('movement-label').textContent = !state.grounded ? 'AIRBORNE' : sprinting ? 'SPRINTING' : 'ON FOOT'; }
  toast(message) {
    clearTimeout(this.toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    this.toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2600);
  }
}
