// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export const parseSocialLinks = async (context) => {
    if (context.method !== 'patch' || !context.data) {
        return context
    }

    // If socialLinks is a string (from FormData), parse it as JSON
    if (context.data.socialLinks && typeof context.data.socialLinks === 'string') {
        try {
            context.data.socialLinks = JSON.parse(context.data.socialLinks)
        } catch (error) {
            // If parsing fails, keep the original value (will be validated by schema)
            console.error('Failed to parse socialLinks JSON:', error)
        }
    }

    return context
}

