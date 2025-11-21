<!--
SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <v-card class="ma-4">
    <v-card-title>Default Model Configuration</v-card-title>
    <v-card-subtitle>
      <v-btn
        density="default"
        icon="mdi-home"
        color="success"
        @click="$router.push({ name: 'XavierBrandingHub', params: {} })"
      ></v-btn>
      <b><i> Professor Xavier's School For The Hidden</i></b>
    </v-card-subtitle>

    <v-card-text>
      <v-form ref="form" v-model="valid">
        <!-- Current Model Status -->
        <v-text-field
          :model-value="siteConfig?.defaultModel?.fileName"
          label="Current Default Model"
          readonly
          class="mb-4"
        ></v-text-field>

        <!-- Model Attributes (if available) -->
        <div
          v-if="
            Object.keys(siteConfig?.defaultModel?.attributes || {}).length > 0
          "
          class="mb-4"
        >
          <h4>Model Attributes:</h4>
          <div class="d-flex flex-wrap">
            <v-chip
              v-for="(attr, key) in siteConfig.defaultModel.attributes"
              :key="key"
              small
              color="primary"
              class="mr-2 mb-1"
            >
              {{ key }}: {{ attr.value }}{{ attr.unit }}
            </v-chip>
          </div>
        </div>

        <!-- Model Viewer -->
        <div v-if="siteConfig?.defaultModelObjUrl" class="mb-4">
          <h4>Model Preview:</h4>
          <div class="model-preview-container">
            <ModelViewer ref="modelViewer" @model:loaded="modelLoaded" />
          </div>
        </div>

        <!-- File Upload -->
        <v-file-input
          v-model="selectedFile"
          accept=".fcstd,.FCStd,.FCSTD"
          label="Select FCStd file"
          prepend-icon="mdi-file-upload"
          show-size
          :rules="fileRules"
          :disabled="uploading"
          class="mb-4"
        ></v-file-input>

        <!-- Upload Progress -->
        <div v-if="uploading" class="mb-4">
          <v-progress-linear
            indeterminate
            color="primary"
            class="mb-2"
          ></v-progress-linear>
          <p class="text-primary">{{ progressMessage }}</p>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="success"
        variant="elevated"
        :loading="uploading"
        :disabled="!valid || !selectedFile || uploading"
        @click="uploadModel"
      >
        Upload Model
      </v-btn>
    </v-card-actions>

    <!-- Success/Error Messages -->
    <v-snackbar v-model="showSnackbar" :timeout="3000" :color="snackbarColor">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-card>
</template>

<script>
import { mapActions, mapGetters, mapState } from "vuex";
import { SITE_CONFIG_ID } from "@/store/services/site-config";
import ModelViewer from "@/components/ModelViewer.vue";

export default {
  name: "XavierBrandingDefaultModel",
  components: {
    ModelViewer,
  },
  data() {
    return {
      selectedFile: null,
      uploading: false,
      valid: false,
      progressMessage: "",
      showSnackbar: false,
      snackbarMessage: "",
      snackbarColor: "success",
      viewer: null,
      isReloadingOBJ: false,
      fileRules: [
        (v) => {
          if (!v) return true;

          const file = Array.isArray(v) ? v[0] : v;
          if (!file) return true;

          if (!(file instanceof File)) {
            return "Please select a valid file";
          }

          if (file.size >= 50 * 1024 * 1024) {
            return "File size should be less than 50 MB";
          }

          if (!file.name.toLowerCase().endsWith(".fcstd")) {
            return "Only .FCStd files are allowed";
          }

          return true;
        },
      ],
    };
  },
  computed: {
    ...mapState("auth", ["accessToken", "user"]),
    ...mapGetters("app", ["siteConfig"]),
  },
  async created() {
    // Check if user is admin
    if (!(await this.isSiteAdministrator())) {
      console.log("alert-33238-dm");
      this.$router.push({ name: "LensHome", params: {} });
      return;
    }
  },
  methods: {
    ...mapActions('app', ['isSiteAdministrator']),
    async uploadModel() {
      if (!this.selectedFile) {
        this.showMessage("Please select a file first", "error");
        return;
      }

      this.uploading = true;
      this.progressMessage = "Uploading default model file...";

      try {
        const formData = new FormData();
        formData.append("defaultModelFile", this.selectedFile);

        this.progressMessage =
          "Processing default model file and generating assets...";

        if (this.viewer) {
          this.isReloadingOBJ = true;
        }

        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}site-config/${SITE_CONFIG_ID}`,
          {
            method: "PATCH",
            headers: {
              Authorization: this.accessToken,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Upload failed: ${response.status}`
          );
        }

        this.showMessage(
          "Default model uploaded and configured successfully!",
          "success"
        );
        this.selectedFile = null;
      } catch (error) {
        console.error("Failed to upload:", error);
        this.showMessage(
          error.message || "Failed to upload default model",
          "error"
        );
      } finally {
        this.uploading = false;
        this.progressMessage = "";
      }
    },
    showMessage(message, color = "success") {
      this.snackbarMessage = message;
      this.snackbarColor = color;
      this.showSnackbar = true;
    },
    modelLoaded(viewer) {
      this.viewer = viewer;
      this.isReloadingOBJ = false;
      this.$refs.modelViewer.fitModelToScreen();
      setTimeout(() => this.uploadThumbnail(), 500);
    },
    uploadThumbnail() {
      if (this.siteConfig?.defaultModel?.thumbnailPath) {
        return;
      }

      try {
        this.$nextTick(async () => {
          const canvas = document.getElementsByTagName("canvas")[0];
          const image = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );

          const fd = new FormData();
          fd.append("defaultModelThumbnailFile", image);
          const uploadUrl = `${
            import.meta.env.VITE_APP_API_URL
          }site-config/${SITE_CONFIG_ID}`;

          await fetch(uploadUrl, {
            method: "PATCH",
            headers: {
              Authorization: this.accessToken,
            },
            body: fd,
          });
        });
      } catch (e) {
        console.error(e);
      }
    },
  },
  watch: {
    "siteConfig.defaultModelObjUrl": {
      async handler(objUrl) {
        await this.$nextTick();
        if (!objUrl || !this.$refs.modelViewer) {
          return;
        }

        if (this.viewer && this.$refs.modelViewer.viewer) {
          this.$refs.modelViewer.reloadOBJ(objUrl);
        } else {
          this.$refs.modelViewer.init(objUrl);
        }
      },
      immediate: true,
    },
  },
};
</script>

<style scoped>
.model-preview-container {
  width: 60em;
  height: 40em;
  overflow: hidden;
  position: relative;
  align-items: center;
  justify-content: center;
  display: flex;
  margin: 0 auto;
}

.model-preview-container :deep(div) {
  width: 100% !important;
  height: 100% !important;
}

.model-preview-container :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
