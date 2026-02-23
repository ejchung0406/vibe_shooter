import Phaser from 'phaser';
import { t } from '../i18n/i18n';

interface TutorialPage {
    title: string;
    content: { label: string; detail: string }[];
}

function getTutorialPages(): TutorialPage[] {
    return [
        {
            title: t('tutorial.page1.title'),
            content: [
                { label: t('tutorial.page1.label1'), detail: t('tutorial.page1.detail1') },
                { label: t('tutorial.page1.label2'), detail: t('tutorial.page1.detail2') },
                { label: t('tutorial.page1.label3'), detail: t('tutorial.page1.detail3') },
                { label: t('tutorial.page1.label4'), detail: t('tutorial.page1.detail4') },
            ],
        },
        {
            title: t('tutorial.page2.title'),
            content: [
                { label: t('tutorial.page2.label1'), detail: t('tutorial.page2.detail1') },
                { label: t('tutorial.page2.label2'), detail: t('tutorial.page2.detail2') },
                { label: t('tutorial.page2.label3'), detail: t('tutorial.page2.detail3') },
                { label: t('tutorial.page2.label4'), detail: t('tutorial.page2.detail4') },
            ],
        },
        {
            title: t('tutorial.page3.title'),
            content: [
                { label: t('tutorial.page3.label1'), detail: t('tutorial.page3.detail1') },
                { label: t('tutorial.page3.label2'), detail: t('tutorial.page3.detail2') },
                { label: t('tutorial.page3.label3'), detail: t('tutorial.page3.detail3') },
                { label: t('tutorial.page3.label4'), detail: t('tutorial.page3.detail4') },
            ],
        },
        {
            title: t('tutorial.page4.title'),
            content: [
                { label: t('tutorial.page4.label1'), detail: t('tutorial.page4.detail1') },
                { label: t('tutorial.page4.label2'), detail: t('tutorial.page4.detail2') },
                { label: t('tutorial.page4.label3'), detail: t('tutorial.page4.detail3') },
                { label: t('tutorial.page4.label4'), detail: t('tutorial.page4.detail4') },
            ],
        },
        {
            title: t('tutorial.page5.title'),
            content: [
                { label: t('tutorial.page5.label1'), detail: t('tutorial.page5.detail1') },
                { label: t('tutorial.page5.label2'), detail: t('tutorial.page5.detail2') },
                { label: t('tutorial.page5.label3'), detail: t('tutorial.page5.detail3') },
                { label: t('tutorial.page5.label4'), detail: t('tutorial.page5.detail4') },
            ],
        },
    ];
}

export class TutorialScene extends Phaser.Scene {
    private currentPage: number = 0;
    private pageContainer!: Phaser.GameObjects.Container;
    private pageIndicatorContainer!: Phaser.GameObjects.Container;
    private prevBtn!: Phaser.GameObjects.Container;
    private nextBtn!: Phaser.GameObjects.Container;
    private pages!: TutorialPage[];

    constructor() {
        super({ key: 'TutorialScene' });
    }

    create() {
        this.currentPage = 0;
        this.pages = getTutorialPages();
        const w = this.scale.width;
        const h = this.scale.height;

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, w, h);

        // Title
        this.add.text(w / 2, 40, t('tutorial.title'), {
            fontSize: '36px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        // "(Optional — Recommended for new players)"
        this.add.text(w / 2, 75, t('tutorial.subtitle'), {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#888888',
        }).setOrigin(0.5);

        // Page content container
        this.pageContainer = this.add.container(w / 2, h / 2 - 20);
        this.renderPage();

        // Page indicator dots
        this.pageIndicatorContainer = this.add.container(w / 2, h - 130);
        this.renderPageIndicators();

        // Prev / Next buttons
        this.prevBtn = this.createNavButton(w / 2 - 120, h - 80, t('tutorial.prev'), () => this.changePage(-1));
        this.nextBtn = this.createNavButton(w / 2 + 120, h - 80, t('tutorial.next'), () => this.changePage(1));

        // Skip / Back button — use bright color instead of gray
        this.createNavButton(w / 2, h - 30, t('tutorial.back'), () => {
            this.scene.start('StartScene');
        }, 0xff6666, 180);

        this.updateNavButtons();
    }

    private renderPage() {
        this.pageContainer.removeAll(true);
        const page = this.pages[this.currentPage];

        // Page title
        const titleText = this.add.text(0, -160, page.title, {
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.pageContainer.add(titleText);

        // Divider
        const divider = this.add.graphics();
        divider.lineStyle(2, 0x00ff88, 0.5);
        divider.beginPath();
        divider.moveTo(-200, -130);
        divider.lineTo(200, -130);
        divider.strokePath();
        this.pageContainer.add(divider);

        // Content rows
        page.content.forEach((item, index) => {
            const y = -90 + index * 70;

            // Key/label badge
            const badgeBg = this.add.rectangle(-180, y, 100, 36, 0x00ff88, 0.15);
            badgeBg.setStrokeStyle(1, 0x00ff88, 0.4);
            this.pageContainer.add(badgeBg);

            const labelText = this.add.text(-180, y, item.label, {
                fontSize: '15px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: '#00ff88',
                fontStyle: 'bold',
            }).setOrigin(0.5);
            this.pageContainer.add(labelText);

            // Detail text
            const detailText = this.add.text(-110, y, item.detail, {
                fontSize: '15px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: '#cccccc',
                wordWrap: { width: 340 },
            }).setOrigin(0, 0.5);
            this.pageContainer.add(detailText);
        });
    }

    private renderPageIndicators() {
        this.pageIndicatorContainer.removeAll(true);
        const total = this.pages.length;
        const spacing = 20;
        const startX = -((total - 1) * spacing) / 2;

        for (let i = 0; i < total; i++) {
            const active = i === this.currentPage;
            const dot = this.add.circle(startX + i * spacing, 0, active ? 6 : 4, active ? 0x00ff88 : 0x444444);
            this.pageIndicatorContainer.add(dot);
        }
    }

    private createNavButton(
        x: number, y: number, label: string, callback: () => void,
        color: number = 0x00ff88, width: number = 100
    ): Phaser.GameObjects.Container {
        const bg = this.add.rectangle(0, 0, width, 40, color, 0.15);
        bg.setStrokeStyle(2, color, 0.6);
        const text = this.add.text(0, 0, label, {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const container = this.add.container(x, y, [bg, text]);
        container.setSize(width, 40);
        container.setInteractive();

        container.on('pointerover', () => {
            bg.setFillStyle(color, 0.3);
            container.setScale(1.05);
        });
        container.on('pointerout', () => {
            bg.setFillStyle(color, 0.15);
            container.setScale(1);
        });
        container.on('pointerdown', callback);

        return container;
    }

    private changePage(dir: number) {
        const newPage = this.currentPage + dir;
        if (newPage < 0 || newPage >= this.pages.length) return;
        this.currentPage = newPage;
        this.renderPage();
        this.renderPageIndicators();
        this.updateNavButtons();
    }

    private updateNavButtons() {
        this.prevBtn.setAlpha(this.currentPage === 0 ? 0.3 : 1);
        this.nextBtn.setAlpha(this.currentPage === this.pages.length - 1 ? 0.3 : 1);
    }
}
