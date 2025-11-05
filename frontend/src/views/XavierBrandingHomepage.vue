<!--
SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <v-card class="ma-4">
    <v-card-title>Homepage Content Configuration</v-card-title>
    <v-card-subtitle>
      <v-btn density="default" icon="mdi-home" color="success"
        @click="$router.push({ name: 'XavierBrandingHub', params: {} })"></v-btn> <b><i>Professor Xavier's School For
          The Hidden</i></b>
    </v-card-subtitle>
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="ma-2" elevation="1">
              <v-card-title>Homepage Title</v-card-title>
              <v-card-text>
                <v-text-field 
                  v-model="homepageTitle" 
                  label="Homepage Title" 
                  :rules="titleRules" 
                  counter="100"
                  hint="Short title displayed on the homepage"
                ></v-text-field>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="ma-2" elevation="1">
              <v-card-title>RSS Feed Configuration</v-card-title>
              <v-card-text>
                <v-text-field 
                  v-model="rssFeedUrl" 
                  label="RSS Feed URL" 
                  :rules="urlRules"
                  hint="URL for the RSS feed displayed in the sidebar"
                ></v-text-field>
                <v-text-field 
                  v-model="rssFeedName" 
                  label="RSS Feed Name" 
                  :rules="nameRules" 
                  counter="50"
                  hint="Display name for the RSS feed"
                ></v-text-field>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="ma-2" elevation="1">
              <v-card-title>Homepage Content (Markdown)</v-card-title>
              <v-card-text>
                <v-textarea 
                  v-model="homepageContent" 
                  label="Homepage Content" 
                  :rules="contentRules" 
                  rows="10"
                  hint="Markdown content for the homepage. Use standard markdown syntax."
                ></v-textarea>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="ma-2" elevation="1">
              <v-card-title>Preview</v-card-title>
              <v-card-text>
                <v-sheet class="d-flex flex-column flex-md-row w-100 mt-4">
                  <v-sheet name="left_side" class="flex-grow-1">
                    <v-container>
                      <h2>{{ homepageTitle }}</h2>
                    </v-container>
                    <v-card class="ma-4">
                      <v-card-title>{{ homepageTitle }}</v-card-title>
                      <v-card-text>
                        <markdown-viewer :markdown-html="markdownHtml"></markdown-viewer>
                      </v-card-text>
                    </v-card>
                  </v-sheet>

                  <v-sheet
                    name="right_side"
                    border
                    class="flex-shrink-0 w-100 w-md-auto ml-md-4"
                    style="max-width: 24em;"
                  >
                    <vue-rss-feed :feed-url="rssFeedUrl" :name="rssFeedName" limit="7"></vue-rss-feed>
                  </v-sheet>
                </v-sheet>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <div class="d-flex justify-end">
              <v-btn color="success" variant="elevated" @click="saveConfig" :disabled="!valid || isSaving"
                :loading="isSaving">
                Save Changes
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-snackbar v-model="showSnackbar" :timeout="3000" :color="snackbarColor">
      {{ snackbarMessage }}
    </v-snackbar>

  </v-card>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { marked } from "marked";
import MarkdownViewer from "@/components/MarkdownViewer.vue";
import VueRssFeed from "@/components/VueRssFeed.vue";
import { models } from '@feathersjs/vuex';
import { SITE_CONFIG_ID } from '@/store/services/site-config';
import { getTextColorForBackground } from "@/genericHelpers";

export default {
  name: 'XavierBrandingHomepage',
  components: { MarkdownViewer, VueRssFeed },
  data: () => ({
    valid: false,
    isSaving: false,
    homepageTitle: '',
    homepageContent: '',
    rssFeedUrl: '',
    rssFeedName: '',
    showSnackbar: false,
    snackbarMessage: '',
    snackbarColor: 'success',
    titleRules: [
      v => !!v || 'Title is required',
      v => (v && v.length <= 100) || 'Title must be less than 100 characters',
      v => (v && v.length >= 3) || 'Title must be at least 3 characters'
    ],
    contentRules: [
      v => !!v || 'Content is required',
      v => (v && v.length >= 10) || 'Content must be at least 10 characters'
    ],
    urlRules: [
      v => !!v || 'RSS Feed URL is required',
      v => !v || /^https?:\/\/.+/.test(v) || 'Must be a valid URL'
    ],
    nameRules: [
      v => !!v || 'RSS Feed Name is required',
      v => (v && v.length <= 50) || 'Name must be less than 50 characters',
      v => (v && v.length >= 3) || 'Name must be at least 3 characters'
    ]
  }),
  computed: {
    ...mapState('auth', ['user']),
    ...mapGetters('app', ['siteConfig']),
    markdownHtml() {
      return marked.parse(this.homepageContent || '');
    },
  },
  watch: {
    // Watch siteConfig and populate form fields when it loads
    'siteConfig': {
      handler(newVal) {
        if (newVal) {
          if (!this.homepageTitle) {
            this.homepageTitle = newVal.homepageContent?.title || '';
          }
          if (!this.homepageContent) {
            this.homepageContent = newVal.homepageContent?.markdownContent || '';
          }
          if (!this.rssFeedUrl) {
            this.rssFeedUrl = newVal.homepageContent?.rssFeedUrl || '';
          }
          if (!this.rssFeedName) {
            this.rssFeedName = newVal.homepageContent?.rssFeedName || '';
          }
        }
      },
      immediate: true // Run immediately if siteConfig is already loaded
    }
  },
  async created() {
    if (!this.user || !this.user.isTripe) {
      console.log("alert-33237-hp");
      this.$router.push({name: 'LensHome', params: {}});
    }
  },
  methods: {
    getTextColorForBackground,
    async saveConfig() {
      if (!this.valid) return;

      this.isSaving = true;
      try {
        await models.api.SiteConfig.patch(SITE_CONFIG_ID, {
          homepageContent: {
            title: this.homepageTitle,
            markdownContent: this.homepageContent,
            rssFeedUrl: this.rssFeedUrl,
            rssFeedName: this.rssFeedName
          },
        });
        this.showMessage('Configuration saved successfully', 'success');
      } catch (error) {
        console.error('Failed to save config:', error);
        this.showMessage('Failed to save configuration', 'error');
      } finally {
        this.isSaving = false;
      }
    },
    showMessage(message, color = 'success') {
      this.snackbarMessage = message;
      this.snackbarColor = color;
      this.showSnackbar = true;
    },
  }
}
</script>

<style scoped>

</style>
