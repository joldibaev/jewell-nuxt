<template>
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">Перейти к содержимому</a>
  <!-- Колонка на всю высоту экрана: белая «страница» доходит до низа, даже когда контента мало. -->
  <div class="flex min-h-dvh flex-col">
    <AppHeader />
    <main id="main-content" class="container w-full flex-1 bg-white pb-8 pt-6">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
