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
      <v-card color="indigo-darken-3">
        <v-card-title>Shutdown Notice</v-card-title>
        <v-card-text>
          <h1>Service is Shutting Down as of November 22nd, 2024</h1>
          <h2>Please download any of your files that you want to keep!</h2>
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
import Main from '@/layouts/default/Main.vue';
import { mapGetters } from "vuex";

const { Organization } = models.api;

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'LensHome',
  components: {PromotedUsersTable, MarkdownViewer, PromotionsViewer, Main},
  data: () => ({
    lensSiteCuration: null,
  }),
  async created() {
    const response = await Organization.find({
      query: {
        type: 'Ondsel',
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
  },
  methods: {
  }
}
</script>
<style scoped>
::v-deep(.v-skeleton-loader__image) {
  height: 190px;
}
</style>
