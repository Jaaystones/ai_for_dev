import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename with user folder structure
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}/avatar-${Date.now()}.${fileExt}`
    
    console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type)
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Delete existing avatar first if it exists
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(session.user.id)
    
    if (existingFiles && existingFiles.length > 0) {
      console.log('Removing existing files:', existingFiles.length)
      const filesToDelete = existingFiles.map(file => `${session.user.id}/${file.name}`)
      await supabase.storage
        .from('avatars')
        .remove(filesToDelete)
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ 
        error: 'Failed to upload image to storage',
        details: error.message 
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'Upload succeeded but no data returned' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    if (!publicUrl) {
      return NextResponse.json({ 
        error: 'Failed to get public URL for uploaded image' 
      }, { status: 500 })
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      url: publicUrl,
      message: 'Avatar updated successfully' 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
