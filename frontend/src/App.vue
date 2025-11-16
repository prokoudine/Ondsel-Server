<!--
SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <v-app>
    <MainNavigationBar v-if="!$route.meta.isWindowLoadedInIframe"/>
    <v-main class="my-4 mx-2">
      <v-sheet class="fill-height" style="background: #ffffff;" border rounded="lg">
        <router-view/>
      </v-sheet>
    </v-main>
  </v-app>
</template>

<script>
import MainNavigationBar from '@/layouts/default/MainNavigationBar.vue';
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'App',
  components: { MainNavigationBar },
  computed: {
    ...mapGetters('app', ['siteConfig']),
  },
  data: () => ({
  }),
  async created() {
    await this.loadSiteConfig();
  },
  watch: {
    'siteConfig': {
      handler(newVal) {
        if (newVal && newVal.siteTitle) {
          this.updateTitle(newVal.siteTitle);
        }
        if (newVal && newVal.faviconUrl) {
          this.updateFavicon(newVal.faviconUrl);
        }
      },
      immediate: true
    }
  },
  methods: {
    ...mapActions('app', ['loadSiteConfig']),
    updateTitle(title) {
      if (title) {
        document.title = title;
      }
    },
    updateFavicon(faviconUrl) {
      if (!faviconUrl) return;
      
      // Remove all existing favicon links
      document.querySelectorAll('link[rel*="icon"]').forEach(link => link.remove());

      // Determine type based on URL extension
      const urlLower = faviconUrl.toLowerCase();
      const isSVG = urlLower.includes('.svg');
      const type = isSVG ? 'image/svg+xml' : 'image/x-icon';

      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = type;
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  }
}

</script>
