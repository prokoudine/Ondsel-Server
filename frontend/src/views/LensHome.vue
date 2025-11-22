<!--
SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Main>
    <template #title>
      {{ siteConfig?.siteTitle }} Home Page
    </template>
    <template #content>
      <v-card
        v-if="siteConfig?.homepageContent?.banner?.enabled"
        :style="{ backgroundColor: siteConfig.homepageContent.banner.color, color: getTextColorForBackground(siteConfig.homepageContent.banner.color) }"
        class="compact-banner"
      >
        <v-card-title>{{ siteConfig.homepageContent.banner.title }}</v-card-title>
        <v-card-text>
          <markdown-viewer :markdown-html="bannerMarkdownHtml"></markdown-viewer>
        </v-card-text>
      </v-card>
      <v-sheet class="d-flex flex-column flex-md-row w-100 mt-4">
        <v-sheet
          name="left_side"
          class="flex-grow-1"
        >
          <v-container>
            <h2>
              <v-img
                :src="siteConfig?.logoUrl"
                width="2em"
                height="2em"
                class="d-inline-block mr-2"
                style="vertical-align: middle;"
              ></v-img>
              {{ siteConfig?.siteTitle }}
            </h2>
          </v-container>
          <v-card class="ma-4">
            <v-card-title>{{ siteConfig?.homepageContent?.title }}</v-card-title>
            <v-card-text>
              <markdown-viewer :markdown-html="homepageMarkdownHtml"></markdown-viewer>
            </v-card-text>
          </v-card>
          <v-card class="ma-4" v-if="promotedFiltered && promotedFiltered.length">
            <v-card-text>
              <promotions-viewer :promoted="promotedFiltered"></promotions-viewer>
            </v-card-text>
          </v-card>
          <v-card v-if="promotedUsers && promotedUsers.length" flat>
            <v-card-title>Users to Watch</v-card-title>
            <promoted-users-table :promoted-users="promotedUsers"></promoted-users-table>
          </v-card>
        </v-sheet>

        <v-sheet
          v-if="siteConfig?.homepageContent?.rssFeedEnabled"
          name="right_side"
          border
          class="flex-shrink-0 w-100 w-md-auto ml-md-4"
          style="max-width: 24em;"
        >
          <vue-rss-feed :feed-url="siteConfig?.homepageContent?.rssFeedUrl" :name="siteConfig?.homepageContent?.rssFeedName" limit="7"></vue-rss-feed>
        </v-sheet>
      </v-sheet>
    </template>
  </Main>
</template>

<script>

import {models} from "@feathersjs/vuex";
import {marked} from "marked";
import PromotionsViewer from "@/components/PromotionsViewer.vue";
import MarkdownViewer from "@/components/MarkdownViewer.vue";
import PromotedUsersTable from "@/components/PromotedUsersTable.vue";
import VueRssFeed from "@/components/VueRssFeed.vue";
import Main from '@/layouts/default/Main.vue';
import { mapGetters } from "vuex";
import { getTextColorForBackground } from '@/genericHelpers';

const { Organization } = models.api;

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'LensHome',
  components: {PromotedUsersTable, MarkdownViewer, PromotionsViewer, VueRssFeed, Main},
  data: () => ({
    lensSiteCuration: null,
  }),
  async created() {
    const response = await Organization.find({
      query: {
        type: 'Admin',
        publicInfo: 'true',
      }
    });
    if (response.data.length > 0) {
      this.lensSiteCuration = response.data[0].curation;
    }
  },
  computed: {
    ...mapGetters('app', ['siteConfig']),
    homepageMarkdownHtml() {
      return marked.parse(this.siteConfig?.homepageContent?.markdownContent || '');
    },
    promoted: vm => vm.lensSiteCuration && vm.lensSiteCuration.promoted || [],
    promotedFiltered: vm => vm.lensSiteCuration && vm.lensSiteCuration.promoted.filter(p => p.curation.collection !== 'users') || [],
    promotedUsers: vm => vm.lensSiteCuration && vm.lensSiteCuration.promoted.filter(p => p.curation.collection === 'users'),
    bannerMarkdownHtml() {
      return marked.parse(this.siteConfig?.homepageContent?.banner?.content || '');
    },
  },
  methods: {
    getTextColorForBackground,
  }
}
</script>
<style scoped>
::v-deep(.v-skeleton-loader__image) {
  height: 190px;
}
::v-deep(.compact-banner .markdown h1),
::v-deep(.compact-banner .markdown h2) {
  margin: 0.25em 0;
}
</style>
