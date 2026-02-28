// src/hooks/useEmergencyNotifier.js
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabase';

// Sound alert using Web Audio API — no external file needed
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode   = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

    // Three sharp beeps
    const times = [0, 0.25, 0.5];
    times.forEach((t) => {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + t);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gainNode.gain.setValueAtTime(0,   ctx.currentTime + t + 0.15);
    });

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
  } catch {
    // Silently fail if audio is blocked
  }
}

// Request browser push notification permission
async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Show browser push notification
function showBrowserNotification(emergency) {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(`🚨 ${emergency.type} Emergency`, {
    body: `${emergency.description || 'New emergency reported'}\n📍 ${emergency.location_text || 'Unknown location'}`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `emergency-${emergency.id}`,   // prevents duplicate toasts
    requireInteraction: true,           // stays until dismissed
  });
  n.onclick = () => {
    window.focus();
    n.close();
  };
}

export function useEmergencyNotifier(onNewEmergency) {
  const seenIds     = useRef(new Set());
  const isFirstLoad = useRef(true);

  const init = useCallback(async () => {
    // Request permission on mount
    await requestPermission();

    // Seed already-existing IDs so we don't alert on page load
    const { data: existing } = await supabase
      .from('emergencies')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(50);

    (existing || []).forEach((e) => seenIds.current.add(e.id));
    isFirstLoad.current = false;
  }, []);

  useEffect(() => {
    init();

    // Subscribe to INSERT events on the emergencies table
    const channel = supabase
      .channel('emergency-notifier')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergencies' },
        (payload) => {
          const emergency = payload.new;
          if (isFirstLoad.current)         return;
          if (seenIds.current.has(emergency.id)) return;

          seenIds.current.add(emergency.id);

          // 1. Play audio alert
          playAlertSound();

          // 2. Browser push notification
          showBrowserNotification(emergency);

          // 3. Callback so UI can show an in-app toast
          if (onNewEmergency) onNewEmergency(emergency);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
