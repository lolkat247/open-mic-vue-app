<template>
  <footer class="app-footer">
    <span class="footer-rawr">rawr~</span>
    <span class="footer-copyright">© 2025 All Rights Reserved</span>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  margin-top: 2rem;
  position: relative;
  z-index: 1;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.footer-rawr {
  font-family: Monaco, 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.05em;
  transition: color 0.3s ease;
}

.footer-rawr:hover {
  color: rgba(0, 206, 144, 1);
}

.footer-copyright {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.02em;
  transition: color 0.3s ease;
}

.footer-copyright:hover {
  color: rgba(255, 255, 255, 1);
}

@media (max-width: 480px) {
  .app-footer {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    margin-top: 2rem;
    text-align: center;
  }

  .footer-rawr,
  .footer-copyright {
    font-size: 0.8rem;
  }
}
</style>
