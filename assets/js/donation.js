const BTC_ADDRESS = 'bc1quxcpdy4yujdjuzsj74gz0lcpa4xcgnvy05l9nh';
let btcPriceBRL = 0;

export async function fetchBTCPriceBRL() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl');
    if (!response.ok) throw new Error('Erro na API CoinGecko');
    const data = await response.json();
    btcPriceBRL = data.bitcoin.brl;
    const priceDisplay = document.getElementById('btc-price-display');
    if (priceDisplay) priceDisplay.textContent = 'R$ ' + btcPriceBRL.toLocaleString('pt-BR');
    
    // Força atualização da interface se o preço estiver disponível
    const selectedBtn = document.querySelector('.amount-btn.selected');
    if (selectedBtn) {
      updateDonationUI(selectedBtn.dataset.value);
    }
  } catch (error) {
    console.log('Erro ao buscar preço BTC:', error);
    showErrorState();
  }
}

export function calculateSats(valueBRL) {
  if (!btcPriceBRL) return { sats: 0, btc: 0 };
  const btcAmount = valueBRL / btcPriceBRL;
  const sats = Math.floor(btcAmount * 100000000);
  return { sats, btc: btcAmount };
}

export function updateQRCode(amountBTC) {
  const qrContainer = document.getElementById('qrcode');
  if (!qrContainer) return;
  
  qrContainer.innerHTML = ''; // Limpa QR code anterior
  
  const uri = amountBTC > 0 
    ? `bitcoin:${BTC_ADDRESS}?amount=${amountBTC.toFixed(8)}`
    : `bitcoin:${BTC_ADDRESS}`;
    
  try {
    new QRCode(qrContainer, {
      text: uri,
      width: 200,
      height: 200,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.M
    });
  } catch (error) {
    console.log('Erro ao gerar QR Code:', error);
  }
}

export function copyAddress() {
  const copyBtn = document.getElementById('btn-copy-address');
  
  navigator.clipboard.writeText(BTC_ADDRESS).then(() => {
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copiado!';
      copyBtn.style.backgroundColor = '#10b981';
      copyBtn.style.color = '#fff';
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = '';
        copyBtn.style.color = '';
      }, 2000);
    }
  }).catch(err => {
    console.log('Erro ao copiar endereço:', err);
  });
}

function updateDonationUI(valueBRL) {
  const displaySats = document.getElementById('display-sats');
  const displayBtc = document.getElementById('display-btc');
  const displayBrl = document.getElementById('display-brl');
  const customInput = document.getElementById('custom-amount');
  
  const value = parseFloat(valueBRL);
  
  if (isNaN(value) || value <= 0) {
    if (displaySats) displaySats.textContent = '0 sats';
    if (displayBtc) displayBtc.textContent = '0.00000000 BTC';
    if (displayBrl) displayBrl.textContent = 'R$ 0,00';
    updateQRCode(0);
    return;
  }
  
  if (customInput && customInput.value !== value.toString() && value !== parseFloat(customInput.value)) {
     customInput.value = '';
  }
  
  const { sats, btc } = calculateSats(value);
  
  if (displaySats) displaySats.textContent = `${sats.toLocaleString('pt-BR')} sats`;
  if (displayBtc) displayBtc.textContent = `${btc.toFixed(8)} BTC`;
  if (displayBrl) displayBrl.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  updateQRCode(btc);
}

function showErrorState() {
  const displayBtc = document.getElementById('display-btc');
  if (displayBtc) displayBtc.textContent = 'Serviço indisponível';
  updateQRCode(0);
}

function initDonation() {
  fetchBTCPriceBRL();
  
  const amountBtns = document.querySelectorAll('.amount-btn');
  const customInput = document.getElementById('custom-amount');
  const copyBtn = document.getElementById('btn-copy-address');
  
  if (copyBtn) {
    copyBtn.addEventListener('click', copyAddress);
  }
  
  amountBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      amountBtns.forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
      if (customInput) customInput.value = '';
      updateDonationUI(e.target.dataset.value);
    });
  });
  
  if (customInput) {
    customInput.addEventListener('input', (e) => {
      amountBtns.forEach(b => b.classList.remove('selected'));
      const val = parseFloat(e.target.value);
      if (val > 0) {
        updateDonationUI(val);
      } else {
        updateDonationUI(0);
      }
    });
  }
  
  // Exibe o endereço fixo em tela
  const addressDisplay = document.getElementById('btc-address-display');
  if (addressDisplay) addressDisplay.textContent = BTC_ADDRESS;
  
  // Selecionar R$ 50 por padrão
  const defaultBtn = document.querySelector('.amount-btn[data-value="50"]');
  if (defaultBtn) {
    defaultBtn.classList.add('selected');
    // Só atualiza UI se já tivermos o preço, senão fetchBTCPriceBRL fará isso
    if (btcPriceBRL > 0) {
      updateDonationUI(50);
    }
  }
}

document.addEventListener('DOMContentLoaded', initDonation);
