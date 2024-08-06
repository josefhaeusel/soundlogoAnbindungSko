const I18n = VueI18n.createI18n({
    locale: 'English',
    messages: {
        English: {
            title: {
                main: 'Sound Logo Wizard',
                sub: 'Add the iconic Telekom Sound Logo at the end of all videos.<br>Keep everything on brand with the help of AI.'
            },
            upload: {
                instructions: 'Upload a video or drop the file here',
                button: 'Upload a Video',
                allowedFiles: '(max. {maximumFileSize}MB and {maximumVideoLength}s)',
                invalidFormat: {title: 'Unsupported file', description: 'The provided file is invalid.' },
                supportedFormats: 'Only videos are supported.',
                supportedResolutions: 'Supported resolutions: FullHD, UHD.',
                supportedRatios: 'Supported ratios: 16:9, 9:16, 1:1.',
                supportedAnimationLength: 'The existing T-Outro Animation is too short.',
                supportedVideoLength: 'The video must not be longer than {maximumVideoLength} seconds.',
                supportedFileSize: 'The video must not be larger than {maximumFileSize}MB.',
                brandPortal: 'Please use the official <a h-ref="www.brand-design.telekom.com">T-Outro Animation</a>.<br />',
                generalError: {title: 'Something went wrong.', description:'Please try reloading the page and uploading the file again. If the error persists, consider contacting the Brand Design team.'},
            },
            header: {
                contact: 'Contact Brand Design team'
            },
            progressTexts: ['Uploading Video...', 'Retrieving Video Data...', 'Converting Video Format...',"Splitting Audio from Video...", "Detecting T-Outro Animation...", "Retrieving Key and Loudness...", "Appending T-Outro Animation...", "Loading Video...", "Done."],
            analyzing: 'Analyzing...',
            error: 'Something went wrong. Please try uploading again.',
            video: {
                noJs: 'To view this video please enable JavaScript, and consider upgrading to a web browser that',
                upgrade: 'supports HTML5 video'
            },
            download: {
                result: 'Download Result'
            },
            soundlogo: {
                key: 'Sound Logo Key',
                recommended: '{key} recommended',
                bothKeysPossible: 'Both possible'
            },
            actions: {
                title: 'What we did:',
                appendedAnimation: 'Appended Animation',
                logoDetected: 'Detected Animation',
                appendedDescription: 'Because the T-Outro Animation could not be detected, it was appended to the video\'s ending.',
                detectedDescription: 'The T-Outro Animation was detected by Computer-Vision AI.',
                setSoundlogo: 'Set Sound Logo',
                synchronized: 'The Telekom Sound Logo has been synchronized to the T-Outro animation.',
                matched: 'Its tonality and loudness have been matched to the AI-detected music. The music has been filtered and faded for a smooth transition.',
                audioEmpty: 'Your video\'s audio track is empty or doesn\'t exist. The Sound Logo\'s tonality and loudness have been set to standardized values.',
                silentEnding: 'Your video ending (except animation) is silent. The Sound Logo\'s tonality has been set to standardized values.',
                convertedFormat: 'Converted Format',
                convertedDescription: 'Converted video codec from {codec} to H264 (.mp4).',
                masteredLoudness: 'Mastered Loudness',
                loudness: 'The overall loudness of the audio track has been set to standardized {loudness}LUFS.'
            },
            relatedLinks: {
                title: 'Related links',
                subtitle: 'Do you have any questions or want to find out more about Telekom Magenta? Let our brand design team help you further.',
                guidelines: {
                    title: 'All about Magenta',
                    description: 'Do you have any questions or want to find out more about Telekom Magenta? Let our brand design team help you further.',
                    button: 'Our brand design guidelines',
                },
                dialog: {
                    title: 'Brand design approvals',
                    description: 'Do you need help with creating communication or need your designs approved? The <span class="text-nowrap">Brand Dialog</span> online platform is the right place for you.',
                    button: 'Visit Brand Dialog',
                },
                support: {
                    title: 'Get personal support',
                    description: 'Take advantage of the personal support our Brand Design Team for all questions related to the Group\'s brand design and for individual expert advice on your project.',
                    button: 'Contact the Brand Design Team',
                },
            },
            footer: {
                impressum: {
                    name: 'Imprint',
                    href: "https://content.brand-dialog.telekom.com/en/magenta-colorfix-nutzungsbestimmungen/"
                },
                terms: {
                    name: 'Terms of Use',
                    href: "https://content.brand-dialog.telekom.com/en/magenta-colorfix-terms-of-use/"
                },
                data: {
                    name: 'Data Privacy',
                    href: "https://content.brand-dialog.telekom.com/en/magenta-colorfix-data-privacy/"
                }
            },
        },
        Deutsch: {
            title: {
                main: 'Sound Logo Wizard',
                sub: 'Binden Sie das ikonische Telekom Sound Logo an das Ende aller Videos an.<br>Bleibe mithilfe von KI on-Brand.'
            },
            upload: {
                instructions: 'Laden Sie ein Video hoch oder ziehen Sie die Datei hierher',
                invalidFormat: { title: 'Datei nicht unterstützt.', description:'Die bereitgestellte Datei ist ungültig.'},
                allowedFiles: '(max. {maximumFileSize}MB und {maximumVideoLength}s)',
                button: 'Ein Video hochladen',
                supportedFormats: 'Nur Videos werden unterstützt.',
                supportedResolutions: 'Unterstützte Auflösungen: FullHD, UHD.',
                supportedRatios: 'Unterstützte Ratios: 16:9, 9:16, 1:1.',
                supportedAnimationLength: 'Die vorhandene T-Outro Animation ist zu kurz.',
                supportedVideoLength: 'Das Video darf nicht länger als {maximumVideoLength} Sekunden sein.',
                supportedFileSize: 'Das Video darf nicht größer als {maximumFileSize}MB sein.',
                brandPortal: 'Bitte nutzen Sie die offizielle <a h-ref="www.brand-design.telekom.com">T-Outro Animation</a>.<br />',
                generalError: {title: 'Etwas ist schiefgeloffen', description:'Bitte versuchen Sie, die Seite zu aktualisieren und die Datei erneut hochzuladen. Sollte der Fehler weiterhin bestehen, wenden Sie sich bitte an das Brand Design Team.' }

            },
            header: {
                contact: 'Brand Design Team kontaktieren'
            },
            progressTexts: ['Video hochladen...', 'Videodaten abrufen...', 'Videoformat konvertieren...', "Audio vom Video trennen...", "T-Outro-Animation ermitteln...", "Tonart und Lautstärke erkennen...", "T-Outro-Animation anhängen...", "Video laden...", "Fertig."],
            analyzing: 'Analysieren...',
            error: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut hochzuladen.',
            video: {
                noJs: 'Um dieses Video anzusehen, aktivieren Sie bitte JavaScript und erwägen Sie ein Upgrade auf einen Webbrowser, der',
                upgrade: 'HTML5-Video unterstützt'
            },
            download: {
                result: 'Video Herunterladen'
            },
            soundlogo: {
                key: 'Sound Logo Tonart',
                recommended: '{key} empfohlen',
                bothKeysPossible: 'Beide möglich'
            },
            actions: {
                title: 'Was wir erledigt haben:',
                appendedAnimation: 'Animation angebunden',
                logoDetected: 'Animation erkannt',
                appendedDescription: 'Da die T-Outro Animation nicht erkannt werden konnte, wurde sie an das Videoende angehängt.',
                detectedDescription: 'Die T-Outro Animation wurde durch Computer-Vision AI erkannt.',
                setSoundlogo: 'Sound Logo platziert',
                synchronized: 'Das Telekom Sound Logo wurde mit der T-Outro Animation synchronisiert.',
                matched: 'Seine Tonalität und Lautstärke wurden an die von der KI erkannte Musik angepasst. Die Musik wurde gefiltert und für einen sanften Übergang ausgeblendet.',
                audioEmpty: 'Die Audiospur Ihres Videos ist leer oder existiert nicht. Die Tonalität und Lautstärke des Sound Logos wurden auf standardisierte Werte eingestellt.',
                silentEnding: 'Ihr Videoende (außer Animation) ist still. Die Tonalität des Sound Logos wurde auf standardisierte Werte eingestellt.',
                convertedFormat: 'Format konvertiert',
                convertedDescription: 'Videocodec konvertiert von {codec} zu H264 (.mp4).',
                masteredLoudness: 'Lautstärke gemastered',
                loudness: 'Die Gesamtlautstärke der Audiospur wurde auf standardisierte {loudness}LUFS gesetzt.'
            },
            relatedLinks: {
                title: 'Weiterführende Links',
                subtitle: 'Du hast Fragen oder möchtest mehr über Telekom Magenta erfahren? Unser Brand Design Team hilft dir gerne weiter.',
                guidelines: {
                    title: 'Alles über Magenta',
                    description: 'Die Telekom ist eines der wenigen Unternehmen, das man international über seine Markenfarbe erkennt. Alle Gestaltungsvorgaben und fünf Prinzipien für den Einsatz von Magenta.',
                    button: 'Unsere Brand Design-Guidelines',
                },
                dialog: {
                    title: 'Brand Design-Freigaben',
                    description: 'Du benötigst Hilfe bei der Erstellung von Kommunikation oder möchtest deine Artworks freigeben lassen? Dann nutze dazu unsere Online-Plattform <span class="text-nowrap">Brand Dialog</span>.',
                    button: 'Brand Dialog-Plattform öffnen',
                },
                support: {
                    title: 'Persönlicher Support',
                    description: 'Nutze den persönlichen Austausch mit dem Brand Design Team für alle Fragen rund um den Markenauftritt des Konzerns und für eine individuelle Beratung zu deinem Projekt.',
                    button: 'Brand Design Team kontaktieren',
                },
            },
            footer: {
                impressum: {
                    name: 'Impressum',
                    href: "https://content.brand-dialog.telekom.com/de/magenta-colorfix-nutzungsbestimmungen/"
                },
                terms: {
                    name: 'Nutzungsbestimmungen',
                    href: "https://content.brand-dialog.telekom.com/de/magenta-colorfix-terms-of-use/"
                },
                data: {
                    name: 'Datenschutz',
                    href: "https://content.brand-dialog.telekom.com/de/magenta-colorfix-data-privacy/"
                }
            },

        }
    }
})