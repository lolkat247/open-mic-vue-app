<template>
  <div class="slot-card-skeleton">
    <div class="skeleton-position"></div>
    <div class="skeleton-content">
      <div class="skeleton-name"></div>
      <div class="skeleton-details">
        <div class="skeleton-detail-item"></div>
        <div class="skeleton-detail-item"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slot-card-skeleton {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 0.75rem;
}

.skeleton-position {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    rgba(0, 206, 144, 0.15) 25%,
    rgba(0, 206, 144, 0.25) 50%,
    rgba(0, 206, 144, 0.15) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-name {
  height: 1.5rem;
  width: 70%;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 25%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  animation-delay: 0.1s;
}

.skeleton-details {
  display: flex;
  gap: 1rem;
}

.skeleton-detail-item {
  height: 1rem;
  width: 80px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 25%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.08) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  animation-delay: 0.2s;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@media (max-width: 768px) {
  .slot-card-skeleton {
    padding: 0.875rem;
  }

  .skeleton-position {
    width: 36px;
    height: 36px;
  }

  .skeleton-name {
    width: 85%;
  }

  .skeleton-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
