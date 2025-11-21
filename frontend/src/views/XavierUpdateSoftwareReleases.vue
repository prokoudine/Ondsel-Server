<!--
SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Main fluid>
    <template #title>
      Xavier Update Software Releases
    </template>
    <template #content>
      <div class="d-flex ml-4">
        <v-text-field
          v-model="softwareTitle"
          label="Software Title"
          density="compact"
          variant="outlined"
          class="mr-2 mt-1"
          style="max-width: 200px;"
        ></v-text-field>
        <v-btn
          variant="text"
          icon
          :disabled="!softwareTitle"
          @click="saveSoftwareTitle(softwareTitle)"
        >
          <v-icon>mdi-content-save</v-icon>
        </v-btn>
      </div>
      <v-data-table :items="releases" :headers="headers">
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Releases</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              v-if="hasScannedEntries && releases.length > 0"
              color="info"
              variant="elevated"
              class="mr-4"
              @click="refreshFromDB()"
            >
              Refresh from DB
            </v-btn>
            <v-text-field
              v-model="releaseVersion"
              label="Version"
              density="compact"
              variant="outlined"
              class="mr-2 mt-6"
              style="max-width: 150px;"
            ></v-text-field>
            <v-btn
              size="small"
              variant="text"
              icon
              :disabled="!releaseVersion"
              @click="saveVersion(releaseVersion)"
            >
              <v-icon>mdi-content-save</v-icon>
            </v-btn>
          </v-toolbar>
        </template>
        <template #item.actions="{ item }">
          <v-icon
            size="small"
            class="mr-2"
            @click="openEditDialog(item)"
          >
            mdi-pencil
          </v-icon>
        </template>
      </v-data-table>
      <v-data-table :items="weeklies" :headers="headers">
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Weekly Builds</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              v-if="hasScannedEntries && weeklies.length > 0"
              color="info"
              variant="elevated"
              class="mr-4"
              @click="refreshFromDB()"
            >
              Refresh from DB
            </v-btn>
          </v-toolbar>
        </template>
        <template #item.actions="{ item }">
          <v-icon
            size="small"
            class="mr-2"
            @click="openEditDialog(item)"
          >
            mdi-pencil
          </v-icon>
        </template>
      </v-data-table>

      <v-card class="mt-4">
        <v-card-title>
          <div class="text-center">Update GH JSON</div>
        </v-card-title>
        <v-card-subtitle>
          <pre>gh auth login</pre>
          <pre>gh api --method GET /repos/USERNAME/REPO/releases --header 'Accept: application/vnd.github+json' > latest_releases.json</pre>
        </v-card-subtitle>
        <v-card-text>
          <v-textarea
            v-model.trim="rawJson"
            label="Raw JSON"
            hint="Paste the raw GH releases JSON here"
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn
            type="submit"
            color="primary"
            variant="elevated"
            @click="scanReleaseJson()"
          >SCAN JSON</v-btn>
          <v-btn
            v-if="hasScannedEntries && totalScannedEntries > 0"
            type="submit"
            color="success"
            variant="elevated"
            :loading="isSaving"
            @click="bulkSaveAll()"
          >SAVE ALL ({{ totalScannedEntries }})</v-btn>
        </v-card-actions>
      </v-card>
      <v-snackbar v-model="showSnackbar" :timeout="2000" :color="snackbarColor">
        {{ snackbarMessage }}
      </v-snackbar>

      <v-dialog
        v-model="showEditDialog"
        width="auto"
        persistent
      >
        <v-form v-model="isValid" @submit.prevent="commitNewVersion">
          <v-card width="500" max-height="800">
            <v-card-title><div class="text-center">{{ currentEditItem.releaseCadence === 'stable' ? 'Update Stable Release' : 'Update Weekly Build' }}</div></v-card-title>
            <v-card-text>
              <v-text-field
                :model-value="currentEditItem.releaseCadence"
                label="Release Cadence"
                readonly
              ></v-text-field>
              <v-text-field
                :model-value="currentEditItem.target"
                label="Release Target"
                readonly
              ></v-text-field>
              <v-text-field
                v-model="editDownloadUrl"
                label="Download URL"
                :rules="[rules.isUrl]"
                hint="Enter the download URL (e.g., GitHub releases URL)"
              ></v-text-field>
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn
                color="cancel"
                variant="elevated"
                @click="showEditDialog = false"
              >Cancel</v-btn>
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                :disabled="!isValid"
              >Save Changes</v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-dialog>
    </template>
  </Main>
</template>

<script>

import Main from '@/layouts/default/Main.vue';
import {mapActions, mapState} from "vuex";
import {models} from "@feathersjs/vuex";
import { SITE_CONFIG_ID } from '@/store/services/site-config';

const { Publisher, SiteConfig } = models.api;

export default {
  name: 'XavierUpdateSoftwareReleases',
  components: {
    Main
  },
  data: () => ({
    rawJson: '',
    releases: [],
    releaseFileTypes: {
      'Linux-x86_64.AppImage': /.*Linux-x86_64.*\.AppImage$/i,
      'Linux-x86_64.AppImage-SHA256.txt': /.*Linux-x86_64.*\.AppImage-SHA256\.txt$/i,
      'Linux-aarch64.AppImage': /.*Linux-aarch64.*\.AppImage$/i,
      'Linux-aarch64.AppImage-SHA256.txt': /.*Linux-aarch64.*\.AppImage-SHA256\.txt$/i,
      'macOS-apple-silicon-arm64.dmg': /.*macOS-arm64.*\.dmg$/i,
      'macOS-apple-silicon-arm64.dmg-SHA256.txt': /.*macOS-arm64.*\.dmg-SHA256\.txt$/i,
      'macOS-intel-x86_64.dmg': /.*macOS-x86_64.*\.dmg$/i,
      'macOS-intel-x86_64.dmg-SHA256.txt': /.*macOS-x86_64.*\.dmg-SHA256\.txt$/i,
      'Windows-x86_64-installer.exe': /.*Windows-x86_64-installer.*\.exe$/i,
      'Windows-x86_64-installer.exe-SHA256.txt': /.*Windows-x86_64-installer.*\.exe-SHA256\.txt$/i,
    },
    weeklies: [],
    weeklyFileTypes: {
      'Linux-aarch64.AppImage': /.*Linux-aarch64.*\.AppImage$/i,
      'Linux-x86_64.AppImage': /.*Linux-x86_64.*\.AppImage$/i,
      'macOS-apple-silicon-arm64.dmg': /.*macOS-arm64.*\.dmg$/i,
      'macOS-intel-x86_64.dmg': /.*macOS-x86_64.*\.dmg$/i,
      'Windows-x86_64.7z': /.*Windows-x86_64.*\.7z$/i,
    },
    headers: [
      { title: 'Name', key: 'target', sortable: true },
      { title: 'Download URL', key: 'downloadUrlResolved', sortable: false },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
    ],
    softwareTitle: '',
    releaseVersion: '',
    hasScannedEntries: false,
    isSaving: false,
    showEditDialog: false,
    currentEditItem: null,
    editDownloadUrl: '',
    isValid: true,
    rules: {
      isUrl: v => {
        if (!v) return 'URL is required';
        try {
          new URL(v);
          return true;
        } catch {
          return 'Must be a valid URL';
        }
      },
    },
    showSnackbar: false,
    snackbarMessage: '',
    snackbarColor: 'success',
  }),
  computed: {
    ...mapState('auth', { loggedInUser: 'payload' }),
    ...mapState('auth', ['user']),
    ...mapState('app', ['siteConfig']),
    totalScannedEntries() {
      return this.releases.length + this.weeklies.length;
    },
  },
  async created() {
    if (!(await this.isSiteAdministrator())) {
      console.log("alert-33235-ru");
      this.$router.push({name: 'LensHome', params: {}});
      return;
    }
    for (const key in this.releaseFileTypes) {
      this.releases.push({
        "target": key,
        "downloadUrlResolved": "--not-set--",
        "releaseCadence": "stable",
      })
    }
    for (const key in this.weeklyFileTypes) {
      this.weeklies.push({
        "target": key,
        "downloadUrlResolved": "--not-set--",
        "releaseCadence": "weekly-builds",
      })
    }
    await this.scanPublisherCollection();
  },
  methods: {
    ...mapActions('app', ['isSiteAdministrator']),
    async scanPublisherCollection() {
      this.softwareTitle = this.siteConfig?.softwareTitle || '';
      this.releaseVersion = this.siteConfig?.stableReleaseVersion || '';

      const results = await Publisher.find({query: {$limit: 100}});
      const publishedList = results.data;
      for (const item of publishedList) {
        const cadence = item.releaseCadence;
        if (cadence === 'stable') {
          this.setWebRelease(item.target, {downloadUrlResolved: item.downloadUrlResolved});
        } else {
          this.setWebWeekly(item.target, {downloadUrlResolved: item.downloadUrlResolved});
        }
      }
    },
    async scanReleaseJson() {
      let json = JSON.parse(this.rawJson);

      const latestRelease = json.find(release => release.prerelease !== true);
      this.releaseVersion = latestRelease.tag_name;
      let assets = latestRelease.assets || []
      for (let [key, value] of Object.entries(this.releaseFileTypes)) {
        let temp = assets.find(asset => value.test(asset.name));
        if (temp) {
          this.setWebRelease(key, {
            downloadUrlResolved: temp.browser_download_url,
            releaseDate: new Date(latestRelease.published_at).getTime()
          });
        }
      }

      const testingRelease = json.find(release => release.prerelease === true);
      assets = testingRelease.assets || []
      for (let [key, value] of Object.entries(this.weeklyFileTypes)) {
        let temp = assets.find(asset => value.test(asset.name));
        if (temp) {
          this.setWebWeekly(key, {
            downloadUrlResolved: temp.browser_download_url,
            releaseDate: new Date(testingRelease.published_at).getTime()
          });
        }
      }

      this.hasScannedEntries = true;
    },
    setWebRelease(target, params) {
      let index = this.releases.findIndex(entry => entry.target === target);
      if (index >= 0) {
        this.releases[index] = {...this.releases[index], ...params};
      }
    },
    setWebWeekly(target, params) {
      let index = this.weeklies.findIndex(entry => entry.target === target);
      if (index >= 0) {
        this.weeklies[index] = {...this.weeklies[index], ...params};
      }
    },
    openEditDialog(item) {
      this.currentEditItem = item;
      this.editDownloadUrl = item.downloadUrlResolved || '';
      this.showEditDialog = true;
    },
    async commitNewVersion() {
      if (this.isValid) {
        if (this.hasScannedEntries) {
          if (this.currentEditItem.releaseCadence == 'stable') {
            this.releases = this.releases.map(release => release.target === this.currentEditItem.target ? { ...release, downloadUrlResolved: this.editDownloadUrl } : release);
          } else {
            this.weeklies = this.weeklies.map(weekly => weekly.target === this.currentEditItem.target ? { ...weekly, downloadUrlResolved: this.editDownloadUrl } : weekly);
          }

          this.showEditDialog = false;
        } else {
          await Publisher.create({
            target: this.currentEditItem.target,
            releaseCadence: this.currentEditItem.releaseCadence,
            downloadUrl: this.editDownloadUrl,
          });

          this.showEditDialog = false;
          await this.scanPublisherCollection();
        }

      }
    },
    showSnackbarMessage(message, color = 'success') {
      this.snackbarMessage = message;
      this.snackbarColor = color;
      this.showSnackbar = true;
    },
    async saveSoftwareTitle(title) {
      try {
        await SiteConfig.patch(SITE_CONFIG_ID, { softwareTitle: title });
        this.showSnackbarMessage('Software title updated successfully', 'success');
      } catch (error) {
        console.error('Error updating software title:', error);
        this.showSnackbarMessage('Error updating software title: ' + (error.message || 'Unknown error'), 'error');
      }
    },
    async saveVersion(version) {
      try {
        await SiteConfig.patch(SITE_CONFIG_ID, { stableReleaseVersion: version });
        this.showSnackbarMessage('Version updated successfully', 'success');
      } catch (error) {
        console.error('Error updating version:', error);
        this.showSnackbarMessage('Error updating version: ' + (error.message || 'Unknown error'), 'error');
      }
    },
    async refreshFromDB() {
      this.rawJson = '';
      this.hasScannedEntries = false;
      await this.scanPublisherCollection();
      this.showSnackbarMessage('Refreshed from database', 'info');
    },
    async bulkSaveAll() {
      this.isSaving = true;
      try {
        // Combine all entries from releases and weeklies
        const allEntries = [
          ...this.releases.map(entry => ({
            target: entry.target,
            releaseCadence: entry.releaseCadence,
            downloadUrl: entry.downloadUrlResolved || entry.downloadUrl || '',
            releaseDate: entry.releaseDate,
          })),
          ...this.weeklies.map(entry => ({
            target: entry.target,
            releaseCadence: entry.releaseCadence,
            downloadUrl: entry.downloadUrlResolved || entry.downloadUrl || '',
            releaseDate: entry.releaseDate,
          })),
        ];

        const result = await Publisher.create(allEntries);

        if (this.softwareTitle && this.softwareTitle !== this.siteConfig?.softwareTitle) {
          await this.saveSoftwareTitle(this.softwareTitle);
        }
        if (this.releaseVersion && this.releaseVersion !== this.siteConfig?.stableReleaseVersion) {
          await this.saveVersion(this.releaseVersion);
        }

        this.rawJson = '';
        this.hasScannedEntries = false;

        await this.scanPublisherCollection();

        this.showSnackbarMessage(`Successfully saved ${result.created} entries.`, 'success');
      } catch (error) {
        console.error('Error bulk saving entries:', error);
        this.showSnackbarMessage('Error saving entries: ' + (error.message || 'Unknown error'), 'error');
      } finally {
        this.isSaving = false;
      }
    },
  },
}
</script>

<style scoped>

</style>
