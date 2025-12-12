<!--
SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <v-dialog
    v-model="dialog"
    width="auto"
  >
    <v-card width="600" max-height="800">
      <v-card-title>
        <div class="text-center">
          Open model in {{ siteConfig?.desktopApp?.name }}
        </div>
      </v-card-title>
      <v-card-text>
        Don't have the {{ siteConfig?.desktopApp?.name }} app installed?
        <router-link :to="{name: 'DownloadAndExplore'}">Download Now</router-link>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn
          color="cancel"
          variant="elevated"
          @click="dialog = false;"
        >Close</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="launchingInProgress"
          @click="$emit('launchDesktopApp')"
        >Launch {{ siteConfig?.desktopApp?.name }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  name: 'LaunchDesktopAppDialog',
  emits: ['launchDesktopApp'],
  props: {
    launchingInProgress: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    dialog: false,
  }),
  computed: {
    ...mapGetters('app', ['siteConfig']),
  },
  methods: {
    openDialog() {
      this.dialog = true;
    }
  }
}
</script>

<style scoped>

</style>
