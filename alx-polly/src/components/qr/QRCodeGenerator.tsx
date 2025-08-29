"use client";

import { useState } from 'react';
import { QRScanner }from './QRScanner';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Download, Copy, ExternalLink, Camera } from 'lucide-react';


interface QRCodeGeneratorProps {
  pollId: string;
  pollTitle: string;
  className?: string;
}

export function QRCodeGenerator({ pollId, pollTitle, className }: QRCodeGeneratorProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const pollUrl = `${process.env.NEXT_PUBLIC_APP_URL}/polls/${pollId}`;
  const shareText = `Vote in this poll: ${pollTitle}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-code-${pollId}`) as HTMLElement;
    if (!svg) return;

    // Create canvas and convert SVG to image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);

      // Download the image
      const link = document.createElement('a');
      link.download = `poll-${pollId}-qr-code.png`;
      link.href = canvas.toDataURL();
      link.click();

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pollTitle,
          text: shareText,
          url: pollUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  if (showScanner) {
    return (
      <QRScanner
        onScan={data => {
          setShowScanner(false);
          if (data) {
            window.location.href = data;
          }
        }}
        onClose={() => setShowScanner(false)}
        className={className}
      />
    );
  }

  if (!showQR) {
    return (
      <div className={className + ' flex gap-2'}>
        <Button
          onClick={() => setShowQR(true)}
          variant="outline"
          className="w-full"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Poll
        </Button>
        <Button
          onClick={() => setShowScanner(true)}
          variant="outline"
          className="w-full"
        >
          <Camera className="w-4 h-4 mr-2" />
          Scan QR
        </Button>
      </div>
    );
  }

  return (
    <Card className={`${className} animate-fade-in`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Share this Poll</CardTitle>
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
            QR Code
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Scan the QR code or share the link to let others vote
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 dark:bg-gray-900 dark:border-gray-600">
          <QRCodeSVG
            id={`qr-code-${pollId}`}
            value={pollUrl}
            size={200}
            level="M"
            includeMargin={true}
            className="drop-shadow-sm"
          />
        </div>

        {/* Poll URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Poll Link
          </label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-sm truncate">
              {pollUrl}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? (
                <span className="text-green-600 text-xs">Copied!</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={handleShare}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button
            onClick={handleDownloadQR}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
          
          <Button
            onClick={() => window.open(pollUrl, '_blank')}
            variant="outline"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How to share:
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
            <li>• Point your phone camera at the QR code</li>
            <li>• Or copy and share the poll link</li>
            <li>• Poll expires in 24 hours from creation</li>
          </ul>
        </div>

        <Button
          onClick={() => setShowQR(false)}
          variant="ghost"
          className="w-full"
        >
          Hide QR Code
        </Button>
      </CardContent>
    </Card>
  );
}