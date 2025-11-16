<!--
SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Main>
    <template #title>
      <v-icon>mdi-palette</v-icon>
      Branding Configuration
    </template>
    <template #content>
      <v-container>
        <!-- Header Section -->
        <v-card variant="flat" :border="true" class="mb-6">
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-icon color="success" class="mr-3">mdi-school</v-icon>
              <div>
                <h3 class="text-h6 mb-1">{{ siteConfig?.siteTitle }}</h3>
                <p class="text-body-2 text-grey-darken-1 mb-0">Configure your platform's visual identity and content</p>
              </div>
            </div>
            <v-btn
              color="success"
              variant="elevated"
              prepend-icon="mdi-arrow-left"
              @click="$router.push({ name: 'XavierMenu', params: {} })"
            >
              Back to Xavier Menu
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Configuration Cards -->
        <v-row>
          <!-- Logo, Site Title & Copyright Text Card -->
          <v-col cols="12" md="6" lg="4">
            <v-card
              variant="elevated"
              :border="true"
              class="h-100"
              hover
            >
              <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-image</v-icon>
                <span class="text-h6">Logo, Site Title & Copyright</span>
              </v-card-title>
              <v-card-text>
                <p class="text-body-2 text-grey-darken-1 mb-4">
                  Configure the site logo, favicon, site title, and copyright text.
                </p>
                <v-chip
                  v-if="isConfigured('logo-site-title-copyright-text')"
                  color="success"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-check"
                  class="mb-2"
                >
                  Configured
                </v-chip>
                <v-chip
                  v-else
                  color="warning"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-alert"
                  class="mb-2"
                >
                  Not configured
                </v-chip>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-btn
                  color="primary"
                  variant="elevated"
                  block
                  prepend-icon="mdi-cog"
                  @click="$router.push({ name: 'XavierBrandingLogo', params: {} })"
                >
                  Configure
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Homepage Content Card -->
          <v-col cols="12" md="6" lg="4">
            <v-card
              variant="elevated"
              :border="true"
              class="h-100"
              hover
            >
              <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-home</v-icon>
                <span class="text-h6">Homepage Content</span>
              </v-card-title>
              <v-card-text>
                <p class="text-body-2 text-grey-darken-1 mb-4">
                  Edit the homepage title, content, and RSS feed settings.
                </p>
                <v-chip
                  v-if="isConfigured('homepage')"
                  color="success"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-check"
                  class="mb-2"
                >
                  Configured
                </v-chip>
                <v-chip
                  v-else
                  color="warning"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-alert"
                  class="mb-2"
                >
                  Not configured
                </v-chip>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-btn
                  color="primary"
                  variant="elevated"
                  block
                  prepend-icon="mdi-cog"
                  @click="$router.push({ name: 'XavierBrandingHomepage', params: {} })"
                >
                  Configure
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Default Model Card -->
          <v-col cols="12" md="6" lg="4">
            <v-card
              variant="elevated"
              :border="true"
              class="h-100"
              hover
            >
              <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-cube-outline</v-icon>
                <span class="text-h6">Default Model</span>
              </v-card-title>
              <v-card-text>
                <p class="text-body-2 text-grey-darken-1 mb-4">
                  Configure the default model for new user registrations.
                </p>
                <v-chip
                  v-if="isConfigured('defaultModel')"
                  color="success"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-check"
                  class="mb-2"
                >
                  Configured
                </v-chip>
                <v-chip
                  v-else
                  color="warning"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-alert"
                  class="mb-2"
                >
                  Not configured
                </v-chip>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-btn
                  color="primary"
                  variant="elevated"
                  block
                  prepend-icon="mdi-cog"
                  @click="$router.push({ name: 'XavierBrandingDefaultModel', params: {} })"
                >
                  Configure
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Legal Documents Card -->
          <v-col cols="12" md="12" lg="12">
            <v-card
              variant="elevated"
              :border="true"
              class="h-100"
              hover
            >
              <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-file-document-multiple</v-icon>
                <span class="text-h6">Legal Documents</span>
              </v-card-title>
              <v-card-text>
                <p class="text-body-2 text-grey-darken-1 mb-4">
                  Manage Terms of Service, Privacy Policy, and other legal documents.
                </p>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-btn
                  color="primary"
                  variant="elevated"
                  prepend-icon="mdi-shield-account"
                  @click="$router.push({ name: 'XavierUpdateKeyDocuments', params: {name: 'privacy-policy'} })"
                  class="mr-2"
                >
                  Privacy Policy
                </v-btn>
                <v-btn
                  color="primary"
                  variant="elevated"
                  prepend-icon="mdi-file-document"
                  @click="$router.push({ name: 'XavierUpdateKeyDocuments', params: {name: 'terms-of-service'} })"
                  class="mr-2"
                >
                  Terms of Service
                </v-btn>
                <v-btn
                  color="primary"
                  variant="elevated"
                  prepend-icon="mdi-clipboard-text"
                  @click="$router.push({ name: 'XavierUpdateKeyDocuments', params: {name: 'signup-survey-prompt'} })"
                >
                  Survey Prompt
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </Main>
</template>

<script>
import {mapState, mapGetters} from "vuex";
import Main from '@/layouts/default/Main.vue';

export default {
  name: 'XavierBrandingHub',
  components: { Main },
  async created() {
    if (!this.user || !this.user.isTripe) {
      console.log("alert-33235-bh");
      this.$router.push({name: 'LensHome', params: {}});
    }
  },
  computed: {
    ...mapState('auth', ['user']),
    ...mapGetters('app', ['siteConfig']),
  },
  methods: {
    isConfigured(section) {
      if (!this.siteConfig || !this.siteConfig.customized) return false;
      
      switch (section) {
        case 'logo-site-title-copyright-text':
          return this.siteConfig.customized.siteTitle || this.siteConfig.customized.logoUrl || this.siteConfig.customized.faviconUrl || this.siteConfig.customized.copyrightText;
        case 'homepage':
          return this.siteConfig.customized.homepageContent;
        case 'defaultModel':
          return this.siteConfig.customized.defaultModel;
        default:
          return false;
      }
    }
  }
}
</script>

<style scoped>
</style>
