#!/usr/bin/env node

import ngrok from 'ngrok';

async function startTunnel() {
  try {
    console.log('🚀 Starting ngrok tunnel...\n');
    
    // Kill any existing ngrok processes
    try {
      await ngrok.kill();
    } catch (e) {
      // Ignore if no process to kill
    }
    
    const url = await ngrok.connect({
      addr: 5180,
      proto: 'http',
      onStatusChange: status => {
        console.log('Status:', status);
      },
      onLogEvent: data => {
        console.log('Log:', data);
      }
    });
    
    console.log('✅ Tunnel is ready!');
    console.log('═══════════════════════════════════════════════════');
    console.log('📱 Share this URL with anyone:');
    console.log('   ' + url);
    console.log('═══════════════════════════════════════════════════');
    console.log('\nPress Ctrl+C to stop the tunnel\n');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping tunnel...');
      await ngrok.disconnect();
      await ngrok.kill();
      process.exit();
    });
    
  } catch (error) {
    console.error('❌ Error starting tunnel:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

startTunnel();
