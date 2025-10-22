<template>
  <div class="event-header-skeleton">
    <div class="skeleton-title"></div>
    <div class="skeleton-meta">
      <div class="skeleton-meta-item"></div>
      <div class="skeleton-meta-item"></div>
    </div>
    <div class="skeleton-code"></div>
  </div>
</template>

<style scoped>
.event-header-skeleton {
  padding: 2rem 1.5rem;
  text-align: center;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.2) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.skeleton-title {
  height: 2.5rem;
  width: 60%;
  margin: 0 auto 1rem;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 25%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-meta {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.skeleton-meta-item {
  height: 1.25rem;
  width: 120px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 25%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.08) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-code {
  height: 3rem;
  width: 180px;
  margin: 1.5rem auto 0;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(0, 206, 144, 0.15) 25%,
    rgba(0, 206, 144, 0.25) 50%,
    rgba(0, 206, 144, 0.15) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
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
  .event-header-skeleton {
    padding: 1.5rem 1rem;
  }

  .skeleton-title {
    width: 80%;
    height: 2rem;
  }

  .skeleton-meta {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .skeleton-code {
    width: 150px;
    height: 2.5rem;
  }
}
</style>
